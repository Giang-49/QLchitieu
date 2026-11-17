import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number) {
    const wallets = await this.prisma.wallet.findMany({
      where: { user_id: BigInt(userId) },
      orderBy: { created_at: 'desc' },
    });

    const totalBalance = wallets.reduce(
      (sum, w) => sum + Number(w.balance),
      0,
    );

    return {
      wallets: wallets.map((w) => ({
        ...w,
        id: Number(w.id),
        user_id: Number(w.user_id),
        balance: Number(w.balance),
      })),
      totalBalance,
    };
  }

  async findOne(id: number, userId: number) {
    const wallet = await this.prisma.wallet.findFirst({
      where: {
        id: BigInt(id),
        user_id: BigInt(userId),
      },
    });

    if (!wallet) {
      throw new NotFoundException('Ví không tồn tại');
    }

    return {
      ...wallet,
      id: Number(wallet.id),
      user_id: Number(wallet.user_id),
      balance: Number(wallet.balance),
    };
  }

  async create(userId: number, dto: CreateWalletDto) {
    const wallet = await this.prisma.wallet.create({
      data: {
        user_id: BigInt(userId),
        name: dto.name,
        type: dto.type ?? 'cash',
        currency: dto.currency ?? 'VND',
        balance: dto.balance ?? 0,
      },
    });

    return {
      ...wallet,
      id: Number(wallet.id),
      user_id: Number(wallet.user_id),
      balance: Number(wallet.balance),
    };
  }

  async update(id: number, userId: number, dto: UpdateWalletDto) {
    // Verify ownership
    await this.findOne(id, userId);

    const wallet = await this.prisma.wallet.update({
      where: { id: BigInt(id) },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.balance !== undefined && { balance: dto.balance }),
      },
    });

    return {
      ...wallet,
      id: Number(wallet.id),
      user_id: Number(wallet.user_id),
      balance: Number(wallet.balance),
    };
  }

  async remove(id: number, userId: number) {
    // Verify ownership
    await this.findOne(id, userId);

    // Check for transactions linked to this wallet
    const transactionCount = await this.prisma.transaction.count({
      where: { wallet_id: BigInt(id) },
    });

    if (transactionCount > 0) {
      throw new BadRequestException(
        'Không thể xóa ví đã có giao dịch. Vui lòng xóa các giao dịch trước.',
      );
    }

    // Check for debts linked to this wallet
    const debtCount = await this.prisma.debt.count({
      where: { wallet_id: BigInt(id) },
    });

    if (debtCount > 0) {
      throw new BadRequestException(
        'Không thể xóa ví đang có khoản nợ liên kết. Vui lòng xóa các khoản nợ trước.',
      );
    }

    // Check for debt payments linked to this wallet
    const debtPaymentCount = await this.prisma.debtPayment.count({
      where: { wallet_id: BigInt(id) },
    });

    if (debtPaymentCount > 0) {
      throw new BadRequestException(
        'Không thể xóa ví đang có thanh toán nợ liên kết.',
      );
    }

    await this.prisma.wallet.delete({
      where: { id: BigInt(id) },
    });

    return { message: 'Xóa ví thành công' };
  }
}
