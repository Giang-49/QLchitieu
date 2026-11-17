import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  // 1. TẠO MỚI GIAO DỊCH (POST /transactions)
  async create(userId: number, createTransactionDto: CreateTransactionDto) {
    const { wallet_id, category_id, type, amount, note, image_url, transaction_date } = createTransactionDto;

    const wallet = await this.prisma.wallet.findFirst({
      where: { id: BigInt(wallet_id), user_id: BigInt(userId) },
    });

    if (!wallet) {
      throw new BadRequestException('Ví nguồn không tồn tại hoặc không hợp lệ.');
    }

    const category = await this.prisma.category.findFirst({
      where: { id: BigInt(category_id), user_id: BigInt(userId), is_active: true },
    });

    if (!category) {
      throw new BadRequestException('Danh mục không tồn tại hoặc đã bị ẩn.');
    }

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const newTransaction = await prisma.transaction.create({
          data: {
            user_id: BigInt(userId),
            wallet_id: BigInt(wallet_id),
            category_id: BigInt(category_id),
            type,
            amount,
            note,
            image_url,
            transaction_date: new Date(transaction_date),
          },
          include: {
            category: true,
            wallet: true,
          },
        });

        const currentBalance = Number(wallet.balance);
        const numericAmount = Number(amount);
        const updatedBalance = type === 'expense' ? currentBalance - numericAmount : currentBalance + numericAmount;

        await prisma.wallet.update({
          where: { id: BigInt(wallet_id) },
          data: { balance: updatedBalance },
        });

        return newTransaction;
      });

      // US2.3: Kiểm tra cảnh báo ngân sách khi thêm giao dịch chi tiêu mới
      let budgetAlert = null;
      if (type === 'expense') {
        const txDate = new Date(transaction_date);
        const m = txDate.getMonth() + 1;
        const y = txDate.getFullYear();
        const budget = await this.prisma.budget.findFirst({
          where: {
            user_id: BigInt(userId),
            category_id: BigInt(category_id),
            month: m,
            year: y,
          },
        });

        if (budget) {
          const spentResult = await this.prisma.transaction.aggregate({
            where: {
              user_id: BigInt(userId),
              category_id: BigInt(category_id),
              type: 'expense',
              transaction_date: {
                gte: new Date(y, m - 1, 1),
                lt: new Date(y, m, 1),
              },
            },
            _sum: { amount: true },
          });

          const totalSpent = Number(spentResult._sum.amount || 0);
          const budgetAmount = Number(budget.amount);
          const pct = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;

          if (pct >= 100) {
            budgetAlert = {
              level: 'danger',
              message: `Bạn đã bội chi ngân sách danh mục ${category.name}`,
              percentage: Math.round(pct),
            };
          } else if (pct >= 80) {
            budgetAlert = {
              level: 'warning',
              message: `Bạn đã sử dụng ${Math.round(pct)}% ngân sách danh mục ${category.name}`,
              percentage: Math.round(pct),
            };
          }
        }
      }

      return {
        success: true,
        message: 'Thêm giao dịch thành công',
        data: {
          ...this.formatBigInt(result),
          budget_alert: budgetAlert,
        },
      };
    } catch (error: any) {
      throw new BadRequestException(`Lỗi khi thêm giao dịch: ${error.message}`);
    }
  }

  // 2. LẤY DANH SÁCH CÓ BỘ LỌC VÀ PHÂN TRANG (GET /transactions)
  async findAll(userId: number, filters: any) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const skip = (page - 1) * limit;

    const whereCondition: any = { user_id: BigInt(userId) };

    if (filters.wallet_id) whereCondition.wallet_id = BigInt(filters.wallet_id);
    if (filters.category_id) whereCondition.category_id = BigInt(filters.category_id);
    if (filters.type) whereCondition.type = filters.type;
    
    if (filters.from_date && filters.to_date) {
      whereCondition.transaction_date = {
        gte: new Date(filters.from_date),
        lte: new Date(filters.to_date),
      };
    }

    if (filters.search) {
      whereCondition.note = { contains: filters.search }; 
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: whereCondition,
        skip: skip,
        take: limit,
        orderBy: { transaction_date: 'desc' },
        include: {
          category: true,
          wallet: true,
        },
      }),
      this.prisma.transaction.count({ where: whereCondition }),
    ]);

    return {
      message: 'Lấy danh sách giao dịch thành công',
      meta: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
      data: data.map(tx => this.formatBigInt(tx)),
    };
  }

  // 3. XEM CHI TIẾT 1 GIAO DỊCH (GET /transactions/:id)
  async findOne(id: number, userId: number) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: BigInt(id), user_id: BigInt(userId) },
      include: {
        category: true,
        wallet: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Giao dịch không tồn tại.');
    }

    return this.formatBigInt(transaction);
  }

  // 4. SỬA GIAO DỊCH VÀ ĐIỀU CHỈNH SỐ DƯ VÍ (PUT /transactions/:id)
  async update(id: number, userId: number, updateData: any) {
    const oldTransaction = await this.prisma.transaction.findFirst({
      where: { id: BigInt(id), user_id: BigInt(userId) },
    });

    if (!oldTransaction) throw new NotFoundException('Giao dịch không tồn tại.');

    if (updateData.category_id) {
      const cat = await this.prisma.category.findFirst({
        where: { id: BigInt(updateData.category_id), user_id: BigInt(userId), is_active: true },
      });
      if (!cat) throw new BadRequestException('Danh mục mới không tồn tại hoặc đã bị ẩn.');
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { id: oldTransaction.wallet_id },
    });

    if (!wallet) throw new NotFoundException('Ví liên kết không tồn tại.');

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const oldAmount = Number(oldTransaction.amount);
        const newAmount = updateData.amount ? Number(updateData.amount) : oldAmount;
        const newType = updateData.type || oldTransaction.type;
        const oldType = oldTransaction.type;
        const targetWalletId = updateData.wallet_id ? BigInt(updateData.wallet_id) : oldTransaction.wallet_id;

        if (targetWalletId === oldTransaction.wallet_id) {
          let newBalance = Number(wallet.balance);
          // Hoàn tác số tiền cũ
          if (oldType === 'expense') newBalance += oldAmount;
          if (oldType === 'income') newBalance -= oldAmount;

          // Áp dụng số tiền mới
          if (newType === 'expense') newBalance -= newAmount;
          if (newType === 'income') newBalance += newAmount;

          // Cập nhật ví
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: newBalance },
          });
        } else {
          const targetWallet = await prisma.wallet.findFirst({
            where: { id: targetWalletId, user_id: BigInt(userId) },
          });
          if (!targetWallet) throw new NotFoundException('Ví mới không tồn tại.');

          // Hoàn tác ví cũ
          let oldWalletBalance = Number(wallet.balance);
          if (oldType === 'expense') oldWalletBalance += oldAmount;
          if (oldType === 'income') oldWalletBalance -= oldAmount;
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: oldWalletBalance },
          });

          // Áp dụng ví mới
          let targetWalletBalance = Number(targetWallet.balance);
          if (newType === 'expense') targetWalletBalance -= newAmount;
          if (newType === 'income') targetWalletBalance += newAmount;
          await prisma.wallet.update({
            where: { id: targetWallet.id },
            data: { balance: targetWalletBalance },
          });
        }

        // Cập nhật giao dịch
        const updatedTransaction = await prisma.transaction.update({
          where: { id: BigInt(id) },
          data: {
            wallet_id: targetWalletId,
            category_id: updateData.category_id ? BigInt(updateData.category_id) : oldTransaction.category_id,
            type: newType,
            amount: newAmount,
            note: updateData.note !== undefined ? updateData.note : oldTransaction.note,
            image_url: updateData.image_url !== undefined ? updateData.image_url : oldTransaction.image_url,
            transaction_date: updateData.transaction_date ? new Date(updateData.transaction_date) : oldTransaction.transaction_date,
          },
          include: {
            category: true,
            wallet: true,
          },
        });

        return updatedTransaction;
      });

      return {
        success: true,
        message: 'Cập nhật giao dịch thành công',
        data: this.formatBigInt(result)
      };

    } catch (error: any) {
      throw new BadRequestException(`Lỗi khi cập nhật giao dịch: ${error.message}`);
    }
  }

  // 5. XÓA GIAO DỊCH VÀ HOÀN TIỀN VÍ (DELETE /transactions/:id)
  async remove(id: number, userId: number) {
    const transaction = await this.prisma.transaction.findFirst({
        where: { id: BigInt(id), user_id: BigInt(userId) },
      });
  
      if (!transaction) {
        throw new NotFoundException('Giao dịch không tồn tại.');
      }
      
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: BigInt(transaction.wallet_id) },
    });

    if (!wallet) {
      throw new NotFoundException('Ví liên kết không tồn tại.');
    }

    try {
      await this.prisma.$transaction(async (prisma) => {
        const currentBalance = Number(wallet.balance);
        const amount = Number(transaction.amount);
        const restoredBalance = transaction.type === 'expense' ? currentBalance + amount : currentBalance - amount;

        await prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: restoredBalance },
        });

        await prisma.transaction.delete({
          where: { id: BigInt(id) },
        });
      });

      return { success: true, message: 'Xóa giao dịch và hoàn tiền thành công' };
    } catch (error: any) {
      throw new BadRequestException(`Lỗi khi xóa giao dịch: ${error.message}`);
    }
  }

  // Hàm Helper: Tránh lỗi serialize BigInt JSON của NestJS
  private formatBigInt(data: any) {
    if (!data) return data;
    return {
      ...data,
      id: Number(data.id),
      user_id: Number(data.user_id),
      wallet_id: Number(data.wallet_id),
      category_id: Number(data.category_id),
      amount: Number(data.amount),
      category: data.category
        ? {
            ...data.category,
            id: Number(data.category.id),
            user_id: Number(data.category.user_id),
            parent_id: data.category.parent_id ? Number(data.category.parent_id) : null,
          }
        : undefined,
      wallet: data.wallet
        ? {
            ...data.wallet,
            id: Number(data.wallet.id),
            user_id: Number(data.wallet.user_id),
            balance: Number(data.wallet.balance),
          }
        : undefined,
    };
  }
}