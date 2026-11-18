import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PrismaService } from '../prisma/prisma.service';
import { dateRange, positiveInteger } from '../common/date-range';
import { Prisma } from '@prisma/client';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { categoryBranch } from '../categories/category-tree';
import { budgetAlertId, claimBudgetAlert } from '../budgets/budget-alerts';
import { discardReceipt, storeReceipt, validateReceiptLink } from './receipts';
import type { ReceiptFile } from './receipts';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: number,
    dto: CreateTransactionDto,
    receipt?: ReceiptFile,
  ) {
    const user = BigInt(userId);
    const wallet = BigInt(dto.wallet_id);
    const category = BigInt(dto.category_id);
    const date = new Date(dto.transaction_date);
    const image = receipt
      ? await storeReceipt(userId, receipt)
      : validateReceiptLink(dto.image_url);
    const result = await this.prisma
      .$transaction(
        async (prisma) => {
          const activeCategory = await prisma.category.findFirst({
            where: {
              id: category,
              user_id: user,
              is_active: true,
              type: dto.type,
            },
          });
          if (!activeCategory) {
            throw new BadRequestException(
              'Danh mục không tồn tại, đã bị ẩn hoặc không cùng loại giao dịch.',
            );
          }
          const updatedWallet = await prisma.wallet.updateMany({
            where: { id: wallet, user_id: user },
            data: {
              balance: {
                increment: dto.type === 'expense' ? -dto.amount : dto.amount,
              },
            },
          });
          if (!updatedWallet.count)
            throw new BadRequestException('Ví nguồn không hợp lệ.');

          const transaction = await prisma.transaction.create({
            data: {
              ...dto,
              user_id: user,
              wallet_id: wallet,
              category_id: category,
              transaction_date: date,
              image_url: image,
            },
            include: { category: true, wallet: true },
          });
          const budgetAlerts =
            dto.type === 'expense'
              ? await this.budgetAlerts(
                  prisma,
                  user,
                  category,
                  date,
                  transaction.amount,
                )
              : [];
          return { transaction, budgetAlerts };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
      .catch(async (error: unknown) => {
        if (receipt) await discardReceipt(userId, image);
        throw error;
      });

    return {
      success: true,
      message: 'Thêm giao dịch thành công',
      data: {
        ...this.formatBigInt(result.transaction),
        budget_alert: result.budgetAlerts[0] ?? null,
        budget_alerts: result.budgetAlerts,
      },
    };
  }

  private async budgetAlerts(
    prisma: Prisma.TransactionClient,
    user: bigint,
    category: bigint,
    date: Date,
    amount: Prisma.Decimal,
    old?: {
      amount: Prisma.Decimal;
      type: string;
      category_id: bigint;
      transaction_date: Date;
    },
  ) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const budgets = await prisma.budget.findMany({
      where: { user_id: user, year, month, category: { is_active: true } },
      include: { category: { select: { name: true } } },
    });
    if (!budgets.length) return [];
    const tree = await prisma.category.findMany({
      where: { user_id: user, is_active: true },
      select: { id: true, parent_id: true },
    });
    const alerts: {
      id: string;
      level: 'danger' | 'warning';
      message: string;
      percentage: number;
    }[] = [];
    for (const budget of budgets) {
      const branch = categoryBranch(tree, budget.category_id);
      if (!branch.includes(category)) continue;
      const totals = await prisma.transaction.aggregate({
        where: {
          user_id: user,
          category_id: { in: branch },
          type: 'expense',
          transaction_date: {
            gte: new Date(Date.UTC(year, month - 1, 1)),
            lt: new Date(Date.UTC(year, month, 1)),
          },
        },
        _sum: { amount: true },
      });
      const spent = totals._sum.amount ?? new Prisma.Decimal(0);
      if (!budget.amount.isPositive()) continue;
      const oldPeriod = old?.transaction_date;
      const previous = spent
        .minus(amount)
        .plus(
          old?.type === 'expense' &&
            oldPeriod?.getUTCFullYear() === year &&
            oldPeriod.getUTCMonth() === month - 1 &&
            branch.includes(old.category_id)
            ? old.amount
            : 0,
        );
      const percentage = spent
        .div(budget.amount)
        .mul(100)
        .toDecimalPlaces(2)
        .toNumber();
      for (const threshold of [100, 80] as const) {
        const boundary = budget.amount.mul(threshold).div(100);
        if (spent.lt(boundary) || previous.gte(boundary)) continue;
        if (
          !(await claimBudgetAlert(
            prisma,
            user,
            budget.category_id,
            year,
            month,
            threshold,
            percentage,
          ))
        )
          continue;
        const danger = threshold === 100;
        alerts.push({
          id: budgetAlertId(budget.category_id, year, month, threshold),
          level: danger ? 'danger' : 'warning',
          message:
            (danger ? 'Đã chạm hoặc vượt hạn mức ' : 'Sắp chạm hạn mức ') +
            budget.category.name +
            ' · ' +
            Math.round(percentage) +
            '%',
          percentage,
        });
      }
    }
    return alerts.sort((a, b) => {
      return (
        Number(b.level === 'danger') - Number(a.level === 'danger') ||
        b.percentage - a.percentage
      );
    });
  }

  // 2. LẤY DANH SÁCH CÓ BỘ LỌC VÀ PHÂN TRANG (GET /transactions)
  async findAll(userId: number, filters: any) {
    const page =
      filters.page === undefined
        ? 1
        : positiveInteger(filters.page, 'Trang', 1_000_000);
    const limit =
      filters.limit === undefined
        ? 10
        : positiveInteger(filters.limit, 'Kích thước trang', 100);
    const skip = (page - 1) * limit;

    const whereCondition: any = { user_id: BigInt(userId) };

    if (filters.wallet_id)
      whereCondition.wallet_id = BigInt(
        positiveInteger(filters.wallet_id, 'Ví'),
      );
    if (filters.category_id)
      whereCondition.category_id = BigInt(
        positiveInteger(filters.category_id, 'Danh mục'),
      );
    if (filters.type) {
      if (!['income', 'expense'].includes(filters.type))
        throw new BadRequestException('Loại giao dịch không hợp lệ.');
      whereCondition.type = filters.type;
    }
    whereCondition.transaction_date = dateRange(
      filters.from_date,
      filters.to_date,
    );

    if (filters.search) {
      whereCondition.note = { contains: filters.search };
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: whereCondition,
        skip: skip,
        take: limit,
        orderBy: [{ transaction_date: 'desc' }, { id: 'desc' }],
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
      data: data.map((tx) => this.formatBigInt(tx)),
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
  async update(
    id: number,
    userId: number,
    updateData: UpdateTransactionDto,
    receipt?: ReceiptFile,
  ) {
    const uploadedImage = receipt
      ? await storeReceipt(userId, receipt)
      : undefined;
    const result = await this.prisma
      .$transaction(
        async (prisma) => {
          const oldTransaction = await prisma.transaction.findFirst({
            where: { id: BigInt(id), user_id: BigInt(userId) },
          });

          if (!oldTransaction)
            throw new NotFoundException('Giao dịch không tồn tại.');

          const image =
            uploadedImage ??
            (updateData.image_url === undefined ||
            updateData.image_url === oldTransaction.image_url
              ? oldTransaction.image_url
              : validateReceiptLink(updateData.image_url));

          const categoryId =
            updateData.category_id == null
              ? oldTransaction.category_id
              : BigInt(updateData.category_id);
          const newType = updateData.type ?? oldTransaction.type;
          if (
            categoryId !== oldTransaction.category_id ||
            newType !== oldTransaction.type
          ) {
            const cat = await prisma.category.findFirst({
              where: {
                id: categoryId,
                user_id: BigInt(userId),
                is_active: true,
                type: newType,
              },
            });
            if (!cat)
              throw new BadRequestException(
                'Danh mục không tồn tại, đã bị ẩn hoặc không cùng loại giao dịch.',
              );
          }

          const oldAmount = oldTransaction.amount;
          const newAmount =
            updateData.amount == null
              ? oldAmount
              : new Prisma.Decimal(updateData.amount);
          const undo =
            oldTransaction.type === 'expense' ? oldAmount : oldAmount.negated();
          const apply = newType === 'income' ? newAmount : newAmount.negated();
          const targetWalletId =
            updateData.wallet_id == null
              ? oldTransaction.wallet_id
              : BigInt(updateData.wallet_id);

          if (targetWalletId === oldTransaction.wallet_id) {
            await prisma.wallet.update({
              where: { id: oldTransaction.wallet_id },
              data: { balance: { increment: undo.plus(apply) } },
            });
          } else {
            const targetWallet = await prisma.wallet.findFirst({
              where: { id: targetWalletId, user_id: BigInt(userId) },
            });
            if (!targetWallet)
              throw new NotFoundException('Ví mới không tồn tại.');

            // Hoàn tác ví cũ
            await prisma.wallet.update({
              where: { id: oldTransaction.wallet_id },
              data: { balance: { increment: undo } },
            });

            // Áp dụng ví mới
            await prisma.wallet.update({
              where: { id: targetWallet.id },
              data: { balance: { increment: apply } },
            });
          }

          // Cập nhật giao dịch
          const updatedTransaction = await prisma.transaction.update({
            where: { id: BigInt(id) },
            data: {
              wallet_id: targetWalletId,
              category_id: categoryId,
              type: newType,
              amount: newAmount,
              note:
                updateData.note !== undefined
                  ? updateData.note
                  : oldTransaction.note,
              image_url: image,
              transaction_date: updateData.transaction_date
                ? new Date(updateData.transaction_date)
                : oldTransaction.transaction_date,
            },
            include: {
              category: true,
              wallet: true,
            },
          });

          const budgetAlerts =
            updatedTransaction.type === 'expense'
              ? await this.budgetAlerts(
                  prisma,
                  BigInt(userId),
                  categoryId,
                  updatedTransaction.transaction_date,
                  updatedTransaction.amount,
                  oldTransaction,
                )
              : [];
          return {
            updatedTransaction,
            oldImage: oldTransaction.image_url,
            budgetAlerts,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
      .catch(async (error: unknown) => {
        await discardReceipt(userId, uploadedImage);
        throw error;
      });

    if (result.oldImage !== result.updatedTransaction.image_url) {
      await discardReceipt(userId, result.oldImage);
    }

    return {
      success: true,
      message: 'Cập nhật giao dịch thành công',
      data: {
        ...this.formatBigInt(result.updatedTransaction),
        budget_alert: result.budgetAlerts[0] ?? null,
        budget_alerts: result.budgetAlerts,
      },
    };
  }

  // 5. XÓA GIAO DỊCH VÀ HOÀN TIỀN VÍ (DELETE /transactions/:id)
  async remove(id: number, userId: number) {
    const image = await this.prisma.$transaction(
      async (prisma) => {
        const transaction = await prisma.transaction.findFirst({
          where: { id: BigInt(id), user_id: BigInt(userId) },
        });

        if (!transaction) {
          throw new NotFoundException('Giao dịch không tồn tại.');
        }

        await prisma.wallet.update({
          where: { id: transaction.wallet_id },
          data: {
            balance: {
              increment:
                transaction.type === 'expense'
                  ? transaction.amount
                  : transaction.amount.negated(),
            },
          },
        });

        await prisma.transaction.delete({
          where: { id: BigInt(id) },
        });
        return transaction.image_url;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    await discardReceipt(userId, image);

    return { success: true, message: 'Xóa giao dịch và hoàn tiền thành công' };
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
            parent_id: data.category.parent_id
              ? Number(data.category.parent_id)
              : null,
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
