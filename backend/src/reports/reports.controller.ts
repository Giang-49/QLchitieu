import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * GET /reports/category-pie?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
   */
  @Get('category-pie')
  getCategoryPie(
    @Request() req: any,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
  ) {
    return this.reportsService.getCategoryPie(req.user.id, fromDate, toDate);
  }

  /**
   * GET /reports/income-vs-expense?year=2026
   */
  @Get('income-vs-expense')
  getIncomeVsExpense(
    @Request() req: any,
    @Query('year') year?: string,
    @Query('from_date') from?: string,
    @Query('to_date') to?: string,
  ) {
    return this.reportsService.getIncomeVsExpense(req.user.id, year, from, to);
  }

  /**
   * GET /reports/export-excel
   */
  @Get('export-excel')
  exportExcel(
    @Request() req: any,
    @Res() res: Response,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('type') type?: string,
    @Query('wallet_id') walletId?: string,
    @Query('category_id') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.reportsService.exportExcel(req.user.id, res, {
      from_date: fromDate,
      to_date: toDate,
      type,
      wallet_id: walletId,
      category_id: categoryId,
      search,
    });
  }
}
