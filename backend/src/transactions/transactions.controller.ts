import { Controller, Get, Post, Put, Delete, Body, Param, Query, UsePipes, ValidationPipe, UseGuards, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  // 1. TẠO GIAO DỊCH
  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  create(@Request() req: any, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(req.user.id, createTransactionDto);
  }

  // 2. LẤY DANH SÁCH (Đã bổ sung các Query params để nhận bộ lọc từ URL)
  @Get()
  findAll(
    @Request() req: any,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('wallet_id') wallet_id: string,
    @Query('category_id') category_id: string,
    @Query('from_date') from_date: string,
    @Query('to_date') to_date: string,
    @Query('type') type: string,
    @Query('search') search: string,
  ) {
    const filters = { page, limit, wallet_id, category_id, from_date, to_date, type, search };
    return this.transactionsService.findAll(req.user.id, filters);
  }

  // 3. XEM CHI TIẾT
  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.transactionsService.findOne(+id, req.user.id);
  }

  // 4. SỬA GIAO DỊCH (Bổ sung phương thức PUT theo đúng thiết kế API)
  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  update(@Request() req: any, @Param('id') id: string, @Body() updateData: UpdateTransactionDto) {
    return this.transactionsService.update(+id, req.user.id, updateData);
  }

  // 5. XÓA GIAO DỊCH
  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.transactionsService.remove(+id, req.user.id);
  }
}