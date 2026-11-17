import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

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
    const balanceChange =
      dto.type === 'lend' ? -dto.amount : dto.amount;

    const newBalance = Number(wallet.balance) + balanceChange;
    if (newBalance < 0) {
      throw new BadRequestException('Số dư ví không đủ để cho vay');
    }

    const [debt] = await this.prisma.$transaction([
      this.prisma.debt.create({
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
      }),
      this.prisma.wallet.update({
        where: { id: BigInt(dto.wallet_id) },
        data: { balance: { increment: balanceChange } },
      }),
    ]);

    return this.serializeDebt(debt);
  }

  // ── FIND ALL ──────────────────────────────────────────────
  async findAll(userId: number, status?: string) {
    const where: any = { user_id: BigInt(userId) };

    // If filtering by specific status (not overdue), add to where
    if (status && status !== 'overdue') {
      where.status = status;
    }

    const debts = await this.prisma.debt.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = debts.map((d) => {
      const serialized = this.serializeDebt(d);

      // Auto-detect overdue: due_date < today && status not completed
      if (
        d.due_date &&
        d.due_date < today &&
        d.status !== 'completed'
      ) {
        serialized.status = 'overdue';
      }

      return serialized;
    });

    // If filtering by overdue, keep only overdue items
    if (status === 'overdue') {
      return result.filter((d) => d.status === 'overdue');
    }

    return result;
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (
      debt.due_date &&
      debt.due_date < today &&
      debt.status !== 'completed'
    ) {
      serialized.status = 'overdue';
    }

    return serialized;
  }

  // ── CREATE PAYMENT ────────────────────────────────────────
  async createPayment(
    debtId: number,
    userId: number,
    dto: CreatePaymentDto,
  ) {
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

    const newRemaining = remaining - dto.amount;
    const newStatus = newRemaining === 0 ? 'completed' : 'partial';

    // borrow trả nợ → trừ ví, lend thu hồi → cộng ví
    const balanceChange =
      debt.type === 'borrow' ? -dto.amount : dto.amount;

    const newBalance = Number(wallet.balance) + balanceChange;
    if (newBalance < 0) {
      throw new BadRequestException('Số dư ví không đủ để thanh toán');
    }

    const [payment] = await this.prisma.$transaction([
      this.prisma.debtPayment.create({
        data: {
          debt_id: BigInt(debtId),
          wallet_id: BigInt(dto.wallet_id),
          amount: dto.amount,
          note: dto.note ?? null,
          paid_at: dto.paid_at ? new Date(dto.paid_at) : new Date(),
        },
      }),
      this.prisma.debt.update({
        where: { id: BigInt(debtId) },
        data: {
          remaining: newRemaining,
          status: newStatus,
        },
      }),
      this.prisma.wallet.update({
        where: { id: BigInt(dto.wallet_id) },
        data: { balance: { increment: balanceChange } },
      }),
    ]);

    return this.serializePayment(payment);
  }
}
