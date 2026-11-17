import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificationItem {
  id: string;
  type: 'debt_due' | 'debt_overdue' | 'budget_warning' | 'budget_danger';
  title: string;
  message: string;
  target_id: number;
  created_at: Date;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Quét định kỳ hàng ngày lúc 00:00 (hoặc mỗi giờ) để ghi nhận các khoản nợ sắp đến hạn / quá hạn
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyReminders() {
    this.logger.log('Bắt đầu quét kiểm tra lịch nhắc nợ và cảnh báo chi tiêu...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueDebts = await this.prisma.debt.findMany({
      where: {
        due_date: { lt: today },
        status: { in: ['unpaid', 'partial'] },
      },
    });

    if (overdueDebts.length > 0) {
      await this.prisma.debt.updateMany({
        where: {
          id: { in: overdueDebts.map((d) => d.id) },
        },
        data: { status: 'overdue' },
      });
      this.logger.log(`Đã cập nhật trạng thái quá hạn cho ${overdueDebts.length} khoản nợ.`);
    }
  }

  /**
   * Lấy danh sách thông báo & nhắc nhở hiện tại cho người dùng (US2.3 & US5.4)
   */
  async getUserNotifications(userId: number): Promise<NotificationItem[]> {
    const notifications: NotificationItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Quét khoản nợ đến hạn hôm nay hoặc quá hạn (US5.4)
    const debts = await this.prisma.debt.findMany({
      where: {
        user_id: BigInt(userId),
        status: { not: 'completed' },
        due_date: { not: null },
      },
    });

    for (const debt of debts) {
      if (!debt.due_date) continue;
      const dueDate = new Date(debt.due_date);
      dueDate.setHours(0, 0, 0, 0);

      const isLend = debt.type === 'lend';
      const actionType = isLend ? 'thu hồi nợ từ' : 'trả nợ cho';
      const remainingFmt = Number(debt.remaining).toLocaleString('vi-VN');

      if (dueDate.getTime() === today.getTime()) {
        notifications.push({
          id: `debt_due_${debt.id}`,
          type: 'debt_due',
          title: `Đến hạn ${isLend ? 'thu nợ' : 'trả nợ'} hôm nay`,
          message: `Hôm nay là hạn ${actionType} ${debt.person_name}: ${remainingFmt} VND`,
          target_id: Number(debt.id),
          created_at: new Date(),
        });
      } else if (dueDate < today) {
        notifications.push({
          id: `debt_overdue_${debt.id}`,
          type: 'debt_overdue',
          title: `Khoản nợ đã quá hạn!`,
          message: `Khoản ${actionType} ${debt.person_name} (${remainingFmt} VND) đã quá hạn thanh toán.`,
          target_id: Number(debt.id),
          created_at: new Date(),
        });
      }
    }

    // 2. Quét cảnh báo vượt ngân sách tháng hiện tại (US2.3)
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 1);

    const budgets = await this.prisma.budget.findMany({
      where: {
        user_id: BigInt(userId),
        month: currentMonth,
        year: currentYear,
      },
      include: {
        category: true,
      },
    });

    for (const budget of budgets) {
      const spentResult = await this.prisma.transaction.aggregate({
        where: {
          user_id: BigInt(userId),
          category_id: budget.category_id,
          type: 'expense',
          transaction_date: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
        },
        _sum: { amount: true },
      });

      const spent = Number(spentResult._sum.amount || 0);
      const budgetAmount = Number(budget.amount);
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
      const catName = budget.category?.name || 'Danh mục';

      if (percentage >= 100) {
        notifications.push({
          id: `budget_danger_${budget.id}`,
          type: 'budget_danger',
          title: `Vượt hạn mức ngân sách: ${catName}`,
          message: `Chi tiêu danh mục "${catName}" đã đạt ${Math.round(percentage)}% (${spent.toLocaleString('vi-VN')} / ${budgetAmount.toLocaleString('vi-VN')} VND). Bội chi!`,
          target_id: Number(budget.id),
          created_at: new Date(),
        });
      } else if (percentage >= 80) {
        notifications.push({
          id: `budget_warning_${budget.id}`,
          type: 'budget_warning',
          title: `Cảnh báo ngân sách: ${catName}`,
          message: `Chi tiêu danh mục "${catName}" đã đạt ${Math.round(percentage)}% hạn mức tháng này.`,
          target_id: Number(budget.id),
          created_at: new Date(),
        });
      }
    }

    return notifications;
  }
}
