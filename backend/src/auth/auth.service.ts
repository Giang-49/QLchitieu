import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    const password_hash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: dto.email,
          password_hash,
          name: dto.name || dto.email.split('@')[0],
        },
      });

      // Tạo sẵn ví Tiền mặt & các danh mục mặc định để người dùng thao tác ngay
      await tx.wallet.create({
        data: { user_id: createdUser.id, name: 'Tiền mặt', balance: 0, type: 'cash', currency: 'VND' },
      });

      await tx.category.createMany({
        data: [
          { user_id: createdUser.id, name: 'Ăn uống', icon: 'utensils', color: '#E74C3C', type: 'expense' },
          { user_id: createdUser.id, name: 'Mua sắm', icon: 'shopping-bag', color: '#9B59B6', type: 'expense' },
          { user_id: createdUser.id, name: 'Di chuyển', icon: 'car', color: '#3498DB', type: 'expense' },
          { user_id: createdUser.id, name: 'Khác', icon: 'grid', color: '#7F8C8D', type: 'expense' },
          { user_id: createdUser.id, name: 'Tiền lương', icon: 'dollar-sign', color: '#2ECC71', type: 'income' },
        ],
      });

      return createdUser;
    });

    const access_token = this.jwtService.sign({ sub: Number(user.id), email: user.email });
    return {
      message: 'Đăng ký tài khoản thành công',
      data: {
        access_token,
        user: { id: user.id, email: user.email, name: user.name },
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const access_token = this.jwtService.sign({ sub: Number(user.id), email: user.email });
    return {
      message: 'Đăng nhập thành công',
      data: {
        access_token,
        user: { id: user.id, email: user.email, name: user.name },
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { id: true, email: true, name: true, created_at: true },
    });
    return { message: 'Lấy thông tin tài khoản thành công', data: user };
  }
}