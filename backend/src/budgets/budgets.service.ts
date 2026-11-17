import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number, month: number, year: number) {
    const budgets = await this.prisma.budget.findMany({
      where: {
        user_id: BigInt(userId),
        month,
        year,
      },
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const result = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await this.getSpentAmount(
          userId,
          Number(budget.category_id),
          month,
          year,
        );
        const amount = Number(budget.amount);
        const percentage = amount > 0 ? (spent / amount) * 100 : 0;
        const status = this.getStatus(percentage);

        return {
          id: Number(budget.id),
          user_id: Number(budget.user_id),
          category_id: Number(budget.category_id),
          category: budget.category
            ? {
                id: Number(budget.category.id),
                name: budget.category.name,
                icon: budget.category.icon,
                color: budget.category.color,
              }
            : null,
          amount,
          month: budget.month,
          year: budget.year,
          spent: Math.round(spent * 100) / 100,
          percentage: Math.round(percentage * 100) / 100,
          status,
          created_at: budget.created_at,
        };
      }),
    );

    return result;
  }

  async create(userId: number, dto: CreateBudgetDto) {
    // Check unique constraint
    const existing = await this.prisma.budget.findFirst({
      where: {
        user_id: BigInt(userId),
        category_id: BigInt(dto.category_id),
        month: dto.month,
        year: dto.year,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Danh mục này đã được thiết lập hạn mức trong tháng đã chọn',
      );
    }

    // Validate category belongs to user
    const category = await this.prisma.category.findFirst({
      where: {
        id: BigInt(dto.category_id),
        user_id: BigInt(userId),
      },
    });

    if (!category) {
      throw new BadRequestException('Danh mục không tồn tại');
    }

    if (category.type !== 'expense') {
      throw new BadRequestException(
        'Hạn mức ngân sách chỉ áp dụng cho danh mục Chi tiêu (expense)',
      );
    }

    const budget = await this.prisma.budget.create({
      data: {
        user_id: BigInt(userId),
        category_id: BigInt(dto.category_id),
        amount: dto.amount,
        month: dto.month,
        year: dto.year,
      },
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
      },
    });

    return {
      id: Number(budget.id),
      user_id: Number(budget.user_id),
      category_id: Number(budget.category_id),
      category: budget.category
        ? {
            id: Number(budget.category.id),
            name: budget.category.name,
            icon: budget.category.icon,
            color: budget.category.color,
          }
        : null,
      amount: Number(budget.amount),
      month: budget.month,
      year: budget.year,
      created_at: budget.created_at,
    };
  }

  async update(userId: number, id: number, dto: UpdateBudgetDto) {
    const budget = await this.prisma.budget.findFirst({
      where: { id: BigInt(id), user_id: BigInt(userId) },
    });

    if (!budget) {
      throw new NotFoundException('Hạn mức ngân sách không tồn tại');
    }

    const updated = await this.prisma.budget.update({
      where: { id: BigInt(id) },
      data: { amount: dto.amount },
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
      },
    });

    return {
      id: Number(updated.id),
      user_id: Number(updated.user_id),
      category_id: Number(updated.category_id),
      category: updated.category
        ? {
            id: Number(updated.category.id),
            name: updated.category.name,
            icon: updated.category.icon,
            color: updated.category.color,
          }
        : null,
      amount: Number(updated.amount),
      month: updated.month,
      year: updated.year,
      created_at: updated.created_at,
    };
  }

  async remove(userId: number, id: number) {
    const budget = await this.prisma.budget.findFirst({
      where: { id: BigInt(id), user_id: BigInt(userId) },
    });

    if (!budget) {
      throw new NotFoundException('Hạn mức ngân sách không tồn tại');
    }

    await this.prisma.budget.delete({
      where: { id: BigInt(id) },
    });

    return { message: 'Đã xóa hạn mức ngân sách thành công' };
  }

  /**
   * Helper: Check budget alert for a given category in a month/year.
   * Used by transactions service when creating expense transactions.
   */
  async checkBudgetAlert(
    userId: number,
    categoryId: number,
    month: number,
    year: number,
  ): Promise<{ alert_80: boolean; alert_100: boolean; percentage: number }> {
    const budget = await this.prisma.budget.findFirst({
      where: {
        user_id: BigInt(userId),
        category_id: BigInt(categoryId),
        month,
        year,
      },
    });

    if (!budget) {
      return { alert_80: false, alert_100: false, percentage: 0 };
    }

    const spent = await this.getSpentAmount(userId, categoryId, month, year);
    const amount = Number(budget.amount);
    const percentage = amount > 0 ? (spent / amount) * 100 : 0;

    return {
      alert_80: percentage >= 80,
      alert_100: percentage >= 100,
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  /**
   * Calculate total expense spent for a category in a given month/year (including child categories - US4.3).
   */
  private async getSpentAmount(
    userId: number,
    categoryId: number,
    month: number,
    year: number,
  ): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Lấy thêm danh mục con nếu có để tính gộp theo US4.3
    const children = await this.prisma.category.findMany({
      where: { parent_id: BigInt(categoryId), user_id: BigInt(userId) },
      select: { id: true },
    });
    const categoryIds = [BigInt(categoryId), ...children.map((c) => c.id)];

    const result = await this.prisma.transaction.aggregate({
      where: {
        user_id: BigInt(userId),
        category_id: { in: categoryIds },
        type: 'expense',
        transaction_date: {
          gte: startDate,
          lt: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  }

  private getStatus(percentage: number): 'safe' | 'warning' | 'danger' {
    if (percentage >= 100) return 'danger';
    if (percentage >= 70) return 'warning';
    return 'safe';
  }
}
