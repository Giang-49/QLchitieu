import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ensureBudgetAlertsTable } from '../budgets/budget-alerts';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    await ensureBudgetAlertsTable(this);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
