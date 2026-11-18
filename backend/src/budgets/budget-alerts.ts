import { Prisma } from '@prisma/client';

export type BudgetThreshold = 80 | 100;

export function budgetAlertId(
  categoryId: bigint | number,
  year: number,
  month: number,
  threshold: BudgetThreshold,
) {
  return [
    'budget',
    threshold === 100 ? 'danger' : 'warning',
    categoryId,
    year,
    month,
  ].join('_');
}

export function ensureBudgetAlertsTable(prisma: Prisma.TransactionClient) {
  return prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS budget_alerts (
      user_id BIGINT NOT NULL,
      category_id BIGINT NOT NULL,
      year INT NOT NULL,
      month INT NOT NULL,
      threshold TINYINT UNSIGNED NOT NULL,
      percentage DECIMAL(22,2) NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (user_id, category_id, year, month, threshold),
      KEY idx_budget_alert_user_period (user_id, year, month),
      CONSTRAINT fk_budget_alert_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_budget_alert_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE ON UPDATE CASCADE
    )
  `;
}

export async function claimBudgetAlert(
  prisma: Prisma.TransactionClient,
  userId: bigint,
  categoryId: bigint,
  year: number,
  month: number,
  threshold: BudgetThreshold,
  percentage: number,
) {
  // The primary key also prevents two concurrent requests from claiming the same alert.
  const changed = await prisma.$executeRaw`
    INSERT IGNORE INTO budget_alerts (user_id, category_id, year, month, threshold, percentage)
    VALUES (${userId}, ${categoryId}, ${year}, ${month}, ${threshold}, ${percentage})
  `;
  return changed === 1;
}

interface SavedBudgetAlert {
  category_id: bigint;
  threshold: BudgetThreshold;
  percentage: Prisma.Decimal;
  created_at: Date;
}

export function getSavedBudgetAlerts(
  prisma: Prisma.TransactionClient,
  userId: bigint,
  year: number,
  month: number,
) {
  return prisma.$queryRaw<SavedBudgetAlert[]>`
    SELECT category_id, threshold, percentage, created_at
    FROM budget_alerts
    WHERE user_id = ${userId} AND year = ${year} AND month = ${month}
    ORDER BY threshold DESC, created_at DESC
  `;
}
