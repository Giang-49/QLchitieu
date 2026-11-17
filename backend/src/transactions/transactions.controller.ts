import { Controller, Get, Post, Put, Delete, Body, Param, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  // 1. TẠO GIAO DỊCH
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() createTransactionDto: CreateTransactionDto) {
    // Tạm thời gán hardcode userId = 1 cho việc test API (Sau này sẽ lấy từ JWT Token)
    const userId = 1;
    return this.transactionsService.create(userId, createTransactionDto);
  }

  // 2. LẤY DANH SÁCH (Đã bổ sung các Query params để nhận bộ lọc từ URL)
  @Get()
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('wallet_id') wallet_id: string,
    @Query('category_id') category_id: string,
    @Query('from_date') from_date: string,
    @Query('to_date') to_date: string,
    @Query('type') type: string,
    @Query('search') search: string,
  ) {
    const userId = 1;
    const filters = { page, limit, wallet_id, category_id, from_date, to_date, type, search };
    return this.transactionsService.findAll(userId, filters);
  }

  // 3. XEM CHI TIẾT
  @Get(':id')
  findOne(@Param('id') id: string) {
    const userId = 1;
    return this.transactionsService.findOne(+id, userId);
  }

  // 4. SỬA GIAO DỊCH (Bổ sung phương thức PUT theo đúng thiết kế API)
  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  update(@Param('id') id: string, @Body() updateData: any) {
    const userId = 1;
    return this.transactionsService.update(+id, userId, updateData);
  }

  // 5. XÓA GIAO DỊCH
  @Delete(':id')
  remove(@Param('id') id: string) {
    const userId = 1;
    return this.transactionsService.remove(+id, userId);
  }
}