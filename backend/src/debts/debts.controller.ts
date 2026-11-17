import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DebtsService } from './debts.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('debts')
@UseGuards(JwtAuthGuard)
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  // GET /debts?status=unpaid|partial|completed|overdue
  @Get()
  findAll(@Request() req: any, @Query('status') status?: string) {
    return this.debtsService.findAll(req.user.id, status);
  }

  // POST /debts - Tạo khoản nợ mới
  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  create(@Request() req: any, @Body() createDebtDto: CreateDebtDto) {
    return this.debtsService.create(req.user.id, createDebtDto);
  }

  // GET /debts/:id - Chi tiết khoản nợ + lịch sử payments
  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.debtsService.findOne(+id, req.user.id);
  }

  // POST /debts/:id/payments - Ghi nhận thanh toán
  @Post(':id/payments')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createPayment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.debtsService.createPayment(+id, req.user.id, createPaymentDto);
  }
}
