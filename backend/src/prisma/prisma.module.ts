import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Biến Prisma thành module toàn cục, không cần import nhiều lần
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Xuất ra để module khác dùng
})
export class PrismaModule {}