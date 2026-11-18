import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { positiveInteger, vietnamToday } from '../common/date-range';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  async findAll(
    @Request() req: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const now = vietnamToday();
    const m =
      month === undefined
        ? now.getUTCMonth() + 1
        : positiveInteger(month, 'Tháng', 12);
    const y =
      year === undefined
        ? now.getUTCFullYear()
        : positiveInteger(year, 'Năm', 9998);
    const budgets = await this.budgetsService.findAll(req.user.id, m, y);
    return { message: 'Budgets retrieved successfully', data: budgets };
  }

  @Post()
  async create(@Request() req: any, @Body() createBudgetDto: CreateBudgetDto) {
    const budget = await this.budgetsService.create(
      req.user.id,
      createBudgetDto,
    );
    return { message: 'Budget created successfully', data: budget };
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    const budget = await this.budgetsService.update(
      req.user.id,
      id,
      updateBudgetDto,
    );
    return { message: 'Budget updated successfully', data: budget };
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    const result = await this.budgetsService.remove(req.user.id, id);
    return { message: result.message };
  }
}
