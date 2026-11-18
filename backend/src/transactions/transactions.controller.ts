import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { positiveInteger } from '../common/date-range';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { getReceipt, RECEIPT_MAX_BYTES } from './receipts';
import type { ReceiptFile } from './receipts';
import { TransactionsService } from './transactions.service';

type AuthenticatedRequest = Request & { user: { id: number } };
const ReceiptUpload = FileInterceptor('receipt', {
  limits: { fileSize: RECEIPT_MAX_BYTES, files: 1, fields: 10 },
});

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get('receipts/:filename')
  async receipt(
    @Req() req: AuthenticatedRequest,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { bytes, mime } = await getReceipt(req.user.id, filename);
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(bytes, { type: mime, length: bytes.length });
  }

  @Post()
  @UseInterceptors(ReceiptUpload)
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateTransactionDto,
    @UploadedFile() receipt?: ReceiptFile,
  ) {
    return this.transactions.create(req.user.id, dto, receipt);
  }

  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('wallet_id') wallet_id?: string,
    @Query('category_id') category_id?: string,
    @Query('from_date') from_date?: string,
    @Query('to_date') to_date?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.transactions.findAll(req.user.id, {
      page,
      limit,
      wallet_id,
      category_id,
      from_date,
      to_date,
      type,
      search,
    });
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.transactions.findOne(
      positiveInteger(id, 'Giao dịch'),
      req.user.id,
    );
  }

  @Put(':id')
  @UseInterceptors(ReceiptUpload)
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
    @UploadedFile() receipt?: ReceiptFile,
  ) {
    return this.transactions.update(
      positiveInteger(id, 'Giao dịch'),
      req.user.id,
      dto,
      receipt,
    );
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.transactions.remove(
      positiveInteger(id, 'Giao dịch'),
      req.user.id,
    );
  }
}
