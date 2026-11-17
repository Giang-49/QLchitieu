import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * US3.1: Biểu đồ tròn phân bổ chi tiêu theo danh mục
   * GET /reports/category-pie?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
   */
  async getCategoryPie(userId: number, fromDate?: string, toDate?: string) {
    const where: any = {
      user_id: BigInt(userId),
      type: 'expense',
    };

    if (fromDate && toDate) {
      where.transaction_date = {
        gte: new Date(fromDate),
        lte: new Date(toDate + 'T23:59:59.999Z'),
      };
    } else if (fromDate) {
      where.transaction_date = { gte: new Date(fromDate) };
    } else if (toDate) {
      where.transaction_date = { lte: new Date(toDate + 'T23:59:59.999Z') };
    }

    const [transactions, categories] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
              parent_id: true,
            },
          },
        },
      }),
      this.prisma.category.findMany({
        where: { user_id: BigInt(userId), is_active: true },
      }),
    ]);

    const catById = new Map<number, any>();
    for (const c of categories) {
      catById.set(Number(c.id), c);
    }

    const categoryMap = new Map<
      number,
      {
        category_id: number;
        name: string;
        color: string;
        icon: string | null;
        total: number;
        subcategories: Map<number, { id: number; name: string; total: number }>;
      }
    >();

    let grandTotal = 0;

    for (const tx of transactions) {
      const amount = Number(tx.amount);
      grandTotal += amount;

      const rawCatId = Number(tx.category_id);
      const rawCategory = tx.category;

      // US4.3: Nếu là danh mục con (có parent_id), rollup vào danh mục cha
      let targetCatId = rawCatId;
      let targetName = rawCategory ? rawCategory.name : 'Khác';
      let targetColor = rawCategory?.color || '#1F4E79';
      let targetIcon = rawCategory?.icon || null;

      if (rawCategory?.parent_id) {
        const parentCat = catById.get(Number(rawCategory.parent_id));
        if (parentCat) {
          targetCatId = Number(parentCat.id);
          targetName = parentCat.name;
          targetColor = parentCat.color || '#1F4E79';
          targetIcon = parentCat.icon || null;
        }
      }

      if (!categoryMap.has(targetCatId)) {
        categoryMap.set(targetCatId, {
          category_id: targetCatId,
          name: targetName,
          color: targetColor,
          icon: targetIcon,
          total: 0,
          subcategories: new Map(),
        });
      }

      const item = categoryMap.get(targetCatId)!;
      item.total += amount;

      // Nếu có danh mục con, ghi nhận vào subcategories
      if (rawCategory?.parent_id) {
        if (!item.subcategories.has(rawCatId)) {
          item.subcategories.set(rawCatId, {
            id: rawCatId,
            name: rawCategory.name,
            total: 0,
          });
        }
        item.subcategories.get(rawCatId)!.total += amount;
      }
    }

    const items = Array.from(categoryMap.values()).map((item) => {
      const percentage = grandTotal > 0 ? (item.total / grandTotal) * 100 : 0;
      return {
        category_id: item.category_id,
        name: item.name,
        color: item.color,
        icon: item.icon,
        total: Math.round(item.total * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
        subcategories: Array.from(item.subcategories.values()).map((sub) => ({
          ...sub,
          total: Math.round(sub.total * 100) / 100,
          percentage: item.total > 0 ? Math.round((sub.total / item.total) * 10000) / 100 : 0,
        })),
      };
    });

    items.sort((a, b) => b.total - a.total);

    return {
      total_expense: Math.round(grandTotal * 100) / 100,
      items,
    };
  }

  /**
   * US3.2: Biểu đồ cột so sánh Thu vs Chi theo 12 tháng trong năm
   * GET /reports/income-vs-expense?year=2026
   */
  async getIncomeVsExpense(userId: number, yearParam?: number) {
    const year = yearParam ? Number(yearParam) : new Date().getFullYear();

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        user_id: BigInt(userId),
        transaction_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        type: true,
        amount: true,
        transaction_date: true,
      },
    });

    // 12 months array
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
      net: 0,
    }));

    let totalIncomeYear = 0;
    let totalExpenseYear = 0;

    for (const tx of transactions) {
      const d = new Date(tx.transaction_date);
      const m = d.getMonth(); // 0 - 11
      const amount = Number(tx.amount);

      if (tx.type === 'income') {
        monthlyData[m].income += amount;
        totalIncomeYear += amount;
      } else if (tx.type === 'expense') {
        monthlyData[m].expense += amount;
        totalExpenseYear += amount;
      }
    }

    // Compute net for each month
    for (let i = 0; i < 12; i++) {
      monthlyData[i].income = Math.round(monthlyData[i].income * 100) / 100;
      monthlyData[i].expense = Math.round(monthlyData[i].expense * 100) / 100;
      monthlyData[i].net = Math.round((monthlyData[i].income - monthlyData[i].expense) * 100) / 100;
    }

    return {
      year,
      total_income: Math.round(totalIncomeYear * 100) / 100,
      total_expense: Math.round(totalExpenseYear * 100) / 100,
      net_savings: Math.round((totalIncomeYear - totalExpenseYear) * 100) / 100,
      months: monthlyData,
    };
  }

  /**
   * US3.3: Xuất báo cáo giao dịch ra file Excel (.xlsx)
   * GET /reports/export-excel
   */
  async exportExcel(
    userId: number,
    res: Response,
    filters?: {
      from_date?: string;
      to_date?: string;
      type?: string;
      wallet_id?: string;
      category_id?: string;
    },
  ) {
    const where: any = {
      user_id: BigInt(userId),
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.wallet_id) {
      where.wallet_id = BigInt(filters.wallet_id);
    }

    if (filters?.category_id) {
      where.category_id = BigInt(filters.category_id);
    }

    if (filters?.from_date && filters?.to_date) {
      where.transaction_date = {
        gte: new Date(filters.from_date),
        lte: new Date(filters.to_date + 'T23:59:59.999Z'),
      };
    } else if (filters?.from_date) {
      where.transaction_date = { gte: new Date(filters.from_date) };
    } else if (filters?.to_date) {
      where.transaction_date = { lte: new Date(filters.to_date + 'T23:59:59.999Z') };
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        category: true,
        wallet: true,
      },
      orderBy: { transaction_date: 'desc' },
    });

    if (transactions.length === 0) {
      throw new BadRequestException('Không có dữ liệu để xuất');
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'QLchitieu';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Danh sách giao dịch', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    worksheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Ngày giao dịch', key: 'transaction_date', width: 22 },
      { header: 'Phân loại', key: 'type', width: 14 },
      { header: 'Danh mục', key: 'category', width: 22 },
      { header: 'Số tiền (VND)', key: 'amount', width: 20 },
      { header: 'Ví nguồn', key: 'wallet', width: 20 },
      { header: 'Ghi chú', key: 'note', width: 35 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    transactions.forEach((tx, idx) => {
      const typeLabel = tx.type === 'income' ? 'Thu nhập' : 'Chi tiêu';
      const d = new Date(tx.transaction_date);
      const formattedDate = d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      const row = worksheet.addRow({
        stt: idx + 1,
        transaction_date: formattedDate,
        type: typeLabel,
        category: tx.category?.name || 'Chưa phân loại',
        amount: Number(tx.amount),
        wallet: tx.wallet?.name || 'Mặc định',
        note: tx.note || '',
      });

      row.alignment = { vertical: 'middle' };
      row.getCell('stt').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('transaction_date').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('type').alignment = { vertical: 'middle', horizontal: 'center' };

      // Number formatting for amount
      const amountCell = row.getCell('amount');
      amountCell.numFmt = '#,##0';
      amountCell.alignment = { vertical: 'middle', horizontal: 'right' };
      if (tx.type === 'expense') {
        amountCell.font = { color: { argb: 'FFC00000' } };
      } else {
        amountCell.font = { color: { argb: 'FF0070C0' } };
      }
    });

    const filename = `giao-dich-${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
