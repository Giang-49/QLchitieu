import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { vietnamToday } from '../common/date-range';
import { Prisma } from '@prisma/client';

@Injectable()
export class DebtsService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper: serialize BigInt / Decimal fields
  private serializeDebt(debt: any) {
    return {
      ...debt,
      id: Number(debt.id),
      user_id: Number(debt.user_id),
      wallet_id: Number(debt.wallet_id),
      amount: Number(debt.amount),
      remaining: Number(debt.remaining),
      payments: debt.payments
        ? debt.payments.map((p: any) => this.serializePayment(p))
        : undefined,
    };
  }

  private serializePayment(p: any) {
    return {
      ...p,
      id: Number(p.id),
      debt_id: Number(p.debt_id),
      wallet_id: Number(p.wallet_id),
      amount: Number(p.amount),
    };
  }

  // ── CREATE ────────────────────────────────────────────────
  async create(userId: number, dto: CreateDebtDto) {
    // Verify wallet ownership
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: BigInt(dto.wallet_id), user_id: BigInt(userId) },
    });
    if (!wallet) {
      throw new NotFoundException('Ví không tồn tại');
    }

    // lend → trừ ví, borrow → cộng ví
    const balanceChange = dto.type === 'lend' ? -dto.amount : dto.amount;

    const debt = await this.prisma.$transaction(async (prisma) => {
      const updated = await prisma.wallet.updateMany({
        where: {
          id: wallet.id,
          ...(balanceChange < 0 && { balance: { gte: -balanceChange } }),
        },
        data: { balance: { increment: balanceChange } },
      });
      if (!updated.count)
        throw new BadRequestException('Số dư ví không đủ để cho vay');
      return prisma.debt.create({
        data: {
          user_id: BigInt(userId),
          wallet_id: BigInt(dto.wallet_id),
          type: dto.type,
          person_name: dto.person_name,
          amount: dto.amount,
          remaining: dto.amount,
          due_date: dto.due_date ? new Date(dto.due_date) : null,
          note: dto.note ?? null,
        },
      });
    });

    return this.serializeDebt(debt);
  }

  // ── FIND ALL ──────────────────────────────────────────────
  async findAll(userId: number, status?: string) {
    const where: any = { user_id: BigInt(userId) };

    if (
      status &&
      !['unpaid', 'partial', 'completed', 'overdue'].includes(status)
    ) {
      throw new BadRequestException('Trạng thái khoản nợ không hợp lệ');
    }

    const debts = await this.prisma.debt.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    const today = vietnamToday();

    const result = debts.map((d) => {
      const serialized = this.serializeDebt(d);

      // Auto-detect overdue: due_date < today && status not completed
      if (d.due_date && d.due_date < today && d.status !== 'completed') {
        serialized.status = 'overdue';
      }

      return serialized;
    });

    return status ? result.filter((d) => d.status === status) : result;
  }

  // ── FIND ONE ──────────────────────────────────────────────
  async findOne(id: number, userId: number) {
    const debt = await this.prisma.debt.findFirst({
      where: { id: BigInt(id), user_id: BigInt(userId) },
      include: { payments: { orderBy: { paid_at: 'desc' } } },
    });

    if (!debt) {
      throw new NotFoundException('Khoản nợ không tồn tại');
    }

    const serialized = this.serializeDebt(debt);

    // Auto-detect overdue
    const today = vietnamToday();
    if (debt.due_date && debt.due_date < today && debt.status !== 'completed') {
      serialized.status = 'overdue';
    }

    return serialized;
  }

  // ── CREATE PAYMENT ────────────────────────────────────────
  async createPayment(debtId: number, userId: number, dto: CreatePaymentDto) {
    // Verify debt ownership
    const debt = await this.prisma.debt.findFirst({
      where: { id: BigInt(debtId), user_id: BigInt(userId) },
    });

    if (!debt) {
      throw new NotFoundException('Khoản nợ không tồn tại');
    }

    if (debt.status === 'completed') {
      throw new BadRequestException('Khoản nợ đã được thanh toán hoàn tất');
    }

    const remaining = Number(debt.remaining);
    if (dto.amount > remaining) {
      throw new BadRequestException(
        `Số tiền thanh toán (${dto.amount}) vượt quá dư nợ còn lại (${remaining})`,
      );
    }

    // Verify payment wallet ownership
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: BigInt(dto.wallet_id), user_id: BigInt(userId) },
    });
    if (!wallet) {
      throw new NotFoundException('Ví thanh toán không tồn tại');
    }

    const newRemaining = new Prisma.Decimal(debt.remaining).minus(dto.amount);
    const newStatus = newRemaining.isZero() ? 'completed' : 'partial';

    // borrow trả nợ → trừ ví, lend thu hồi → cộng ví
    const balanceChange = debt.type === 'borrow' ? -dto.amount : dto.amount;

    const payment = await this.prisma.$transaction(async (prisma) => {
      const debtUpdate = await prisma.debt.updateMany({
        where: {
          id: debt.id,
          remaining: debt.remaining,
          status: { not: 'completed' },
        },
        data: { remaining: newRemaining, status: newStatus },
      });
      if (!debtUpdate.count)
        throw new BadRequestException(
          'Dư nợ vừa thay đổi. Vui lòng tải lại và thử lại.',
        );
      const walletUpdate = await prisma.wallet.updateMany({
        where: {
          id: wallet.id,
          ...(balanceChange < 0 && { balance: { gte: -balanceChange } }),
        },
        data: { balance: { increment: balanceChange } },
      });
      if (!walletUpdate.count)
        throw new BadRequestException('Số dư ví không đủ để thanh toán');
      return prisma.debtPayment.create({
        data: {
          debt_id: BigInt(debtId),
          wallet_id: BigInt(dto.wallet_id),
          amount: dto.amount,
          note: dto.note ?? null,
          paid_at: dto.paid_at ? new Date(dto.paid_at) : new Date(),
        },
      });
    });

    return this.serializePayment(payment);
  }
}
