import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  // GET /wallets - Danh sách ví + tổng số dư
  @Get()
  findAll(@Request() req: any) {
    return this.walletsService.findAll(req.user.id);
  }

  // POST /wallets - Tạo ví mới
  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  create(@Request() req: any, @Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.create(req.user.id, createWalletDto);
  }

  // GET /wallets/:id - Chi tiết ví
  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.walletsService.findOne(+id, req.user.id);
  }

  // PUT /wallets/:id - Cập nhật ví
  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateWalletDto: UpdateWalletDto,
  ) {
    return this.walletsService.update(+id, req.user.id, updateWalletDto);
  }

  // DELETE /wallets/:id - Xóa ví
  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.walletsService.remove(+id, req.user.id);
  }
}
