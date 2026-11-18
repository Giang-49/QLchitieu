import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { BudgetsService } from '../budgets/budgets.service';
import { vietnamToday } from '../common/date-range';
import { budgetAlertId, getSavedBudgetAlerts } from '../budgets/budget-alerts';
import type { BudgetThreshold } from '../budgets/budget-alerts';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly budgets: BudgetsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleDailyReminders() {
    await this.prisma.debt.updateMany({
      where: {
        due_date: { lt: vietnamToday() },
        status: { in: ['unpaid', 'partial'] },
      },
      data: { status: 'overdue' },
    });
  }

  async getUserNotifications(userId: number): Promise<NotificationItem[]> {
    const today = vietnamToday();
    const month = today.getUTCMonth() + 1;
    const year = today.getUTCFullYear();
    const [debts, budgets, savedAlerts] = await Promise.all([
      this.prisma.debt.findMany({
        where: {
          user_id: BigInt(userId),
          status: { not: 'completed' },
          due_date: { lte: today },
        },
        orderBy: { due_date: 'asc' },
      }),
      this.budgets.findAll(userId, month, year),
      getSavedBudgetAlerts(this.prisma, BigInt(userId), year, month),
    ]);

    const notices: NotificationItem[] = debts.map((debt) => {
      const overdue = debt.due_date! < today;
      const action = debt.type === 'lend' ? 'Thu nợ từ' : 'Trả nợ cho';
      return {
        id: (overdue ? 'debt_overdue_' : 'debt_due_') + debt.id,
        type: overdue ? 'debt_overdue' : 'debt_due',
        title: overdue ? 'Khoản nợ quá hạn' : 'Khoản nợ đến hạn hôm nay',
        message:
          action +
          ' ' +
          debt.person_name +
          ' · ' +
          Number(debt.remaining).toLocaleString('vi-VN') +
          ' ₫',
        target_id: Number(debt.id),
        created_at: debt.due_date!,
      };
    });
    const budgetNotices = new Map<string, NotificationItem>();
    const indexByCategory = new Map(
      budgets.map((budget) => [budget.category_id, budget]),
    );
    const add = (
      budget: (typeof budgets)[number],
      threshold: BudgetThreshold,
      percentage: number,
      date: Date,
    ) => {
      const id = budgetAlertId(budget.category_id, year, month, threshold);
      if (budgetNotices.has(id)) return;
      const exceeded = threshold === 100;
      budgetNotices.set(id, {
        id,
        type: exceeded ? 'budget_danger' : 'budget_warning',
        title: exceeded ? 'Đã chạm hoặc vượt hạn mức' : 'Sắp chạm hạn mức',
        message:
          (budget.category?.name || 'Danh mục') +
          ' · ' +
          percentage.toLocaleString('vi-VN') +
          '% hạn mức tháng',
        target_id: budget.id,
        created_at: date,
      });
    };
    for (const alert of savedAlerts) {
      const budget = indexByCategory.get(Number(alert.category_id));
      if (budget)
        add(
          budget,
          Number(alert.threshold) === 100 ? 100 : 80,
          Number(alert.percentage),
          alert.created_at,
        );
    }
    for (const budget of budgets) {
      if (budget.percentage >= 80)
        add(
          budget,
          budget.percentage >= 100 ? 100 : 80,
          budget.percentage,
          budget.created_at,
        );
    }
    return [...notices, ...budgetNotices.values()];
  }
}
