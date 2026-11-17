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

      return {
        success: true,
        message: 'Thêm giao dịch thành công',
        data: this.formatBigInt(result),
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

    const wallet = await this.prisma.wallet.findUnique({
      where: { id: oldTransaction.wallet_id },
    });

    if (!wallet) throw new NotFoundException('Ví liên kết không tồn tại.');

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        let newBalance = Number(wallet.balance);
        const oldAmount = Number(oldTransaction.amount);
        const newAmount = updateData.amount ? Number(updateData.amount) : oldAmount;
        const newType = updateData.type || oldTransaction.type;
        const oldType = oldTransaction.type;

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

        // Cập nhật giao dịch
        const updatedTransaction = await prisma.transaction.update({
          where: { id: BigInt(id) },
          data: {
            wallet_id: updateData.wallet_id ? BigInt(updateData.wallet_id) : oldTransaction.wallet_id,
            category_id: updateData.category_id ? BigInt(updateData.category_id) : oldTransaction.category_id,
            type: newType,
            amount: newAmount,
            note: updateData.note !== undefined ? updateData.note : oldTransaction.note,
            image_url: updateData.image_url !== undefined ? updateData.image_url : oldTransaction.image_url,
            transaction_date: updateData.transaction_date ? new Date(updateData.transaction_date) : oldTransaction.transaction_date,
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
    return {
      ...data,
      id: Number(data.id),
      user_id: Number(data.user_id),
      wallet_id: Number(data.wallet_id),
      category_id: Number(data.category_id),
      amount: Number(data.amount),
    };
  }
}