import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách danh mục dạng cây cha-con.
   * Chỉ lấy is_active = true, lọc theo type nếu có.
   */
  async findAll(userId: number, type?: string) {
    const where: any = {
      user_id: BigInt(userId),
      is_active: true,
    };

    if (type) {
      if (!['income', 'expense'].includes(type)) {
        throw new BadRequestException('Type phải là income hoặc expense');
      }
      where.type = type;
    }

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // Build tree: nest children into parent
    return this.buildTree(categories);
  }

  /**
   * Tạo danh mục mới.
   */
  async create(userId: number, dto: CreateCategoryDto) {
    // Validate trùng tên danh mục cùng loại
    const existing = await this.prisma.category.findFirst({
      where: {
        user_id: BigInt(userId),
        name: dto.name,
        type: dto.type,
        is_active: true,
      },
    });
    if (existing) {
      throw new BadRequestException('Danh mục cùng tên và loại đã tồn tại');
    }

    // Validate parent_id nếu có
    if (dto.parent_id) {
      const parent = await this.prisma.category.findFirst({
        where: {
          id: BigInt(dto.parent_id),
          user_id: BigInt(userId),
          is_active: true,
        },
      });

      if (!parent) {
        throw new BadRequestException('Danh mục cha không tồn tại');
      }

      if (parent.type !== dto.type) {
        throw new BadRequestException(
          'Danh mục con phải cùng loại (income/expense) với danh mục cha',
        );
      }
    }

    const category = await this.prisma.category.create({
      data: {
        user_id: BigInt(userId),
        name: dto.name,
        icon: dto.icon,
        color: dto.color,
        type: dto.type,
        parent_id: dto.parent_id ? BigInt(dto.parent_id) : null,
      },
    });

    return {
      ...category,
      id: Number(category.id),
      user_id: Number(category.user_id),
      parent_id: category.parent_id ? Number(category.parent_id) : null,
    };
  }

  /**
   * Cập nhật danh mục.
   */
  async update(userId: number, id: number, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({
      where: { id: BigInt(id), user_id: BigInt(userId), is_active: true },
    });

    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    // Validate: parent_id không được trỏ về chính mình
    if (dto.parent_id !== undefined && dto.parent_id !== null) {
      if (Number(dto.parent_id) === Number(id)) {
        throw new BadRequestException(
          'Danh mục cha không được trỏ về chính mình',
        );
      }

      const parent = await this.prisma.category.findFirst({
        where: {
          id: BigInt(dto.parent_id),
          user_id: BigInt(userId),
          is_active: true,
        },
      });

      if (!parent) {
        throw new BadRequestException('Danh mục cha không tồn tại');
      }

      // Check circular: parent không được là con của category hiện tại
      const isChild = await this.isDescendant(dto.parent_id, id, userId);
      if (isChild) {
        throw new BadRequestException(
          'Không thể đặt danh mục con làm danh mục cha (tham chiếu vòng)',
        );
      }
    }

    const updated = await this.prisma.category.update({
      where: { id: BigInt(id) },
      data: {
        name: dto.name,
        icon: dto.icon,
        color: dto.color,
        type: dto.type,
        parent_id: dto.parent_id !== undefined ? (dto.parent_id ? BigInt(dto.parent_id) : null) : undefined,
      },
    });

    return {
      ...updated,
      id: Number(updated.id),
      user_id: Number(updated.user_id),
      parent_id: updated.parent_id ? Number(updated.parent_id) : null,
    };
  }

  /**
   * Xóa danh mục.
   * - Nếu có giao dịch → yêu cầu replace_id, chuyển giao dịch sang danh mục thay thế, soft delete.
   * - Nếu không có giao dịch → hard delete.
   */
  async remove(userId: number, id: number, replaceId?: number) {
    const category = await this.prisma.category.findFirst({
      where: { id: BigInt(id), user_id: BigInt(userId), is_active: true },
    });

    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    // Kiểm tra có giao dịch không
    const transactionCount = await this.prisma.transaction.count({
      where: { category_id: BigInt(id) },
    });

    if (transactionCount > 0) {
      // Có giao dịch → cần replace_id
      if (!replaceId) {
        throw new BadRequestException(
          'Danh mục đang có giao dịch. Vui lòng cung cấp replace_id để chuyển giao dịch sang danh mục thay thế',
        );
      }

      // Validate replace category
      const replaceCategory = await this.prisma.category.findFirst({
        where: {
          id: BigInt(replaceId),
          user_id: BigInt(userId),
          is_active: true,
        },
      });

      if (!replaceCategory) {
        throw new BadRequestException('Danh mục thay thế không tồn tại');
      }

      if (Number(replaceId) === Number(id)) {
        throw new BadRequestException(
          'Danh mục thay thế không được trùng danh mục cần xóa',
        );
      }

      // Chuyển tất cả giao dịch sang danh mục thay thế, rồi soft delete
      await this.prisma.$transaction([
        this.prisma.transaction.updateMany({
          where: { category_id: BigInt(id) },
          data: { category_id: BigInt(replaceId) },
        }),
        this.prisma.category.update({
          where: { id: BigInt(id) },
          data: { is_active: false },
        }),
      ]);

      return { message: `Đã chuyển ${transactionCount} giao dịch và ẩn danh mục` };
    }

    // Không có giao dịch → cập nhật children trỏ về null, rồi hard delete
    await this.prisma.$transaction([
      this.prisma.category.updateMany({
        where: { parent_id: BigInt(id), user_id: BigInt(userId) },
        data: { parent_id: null },
      }),
      this.prisma.category.delete({
        where: { id: BigInt(id) },
      }),
    ]);

    return { message: 'Đã xóa danh mục' };
  }

  // ——————————— Private helpers ———————————

  /**
   * Build tree từ flat list.
   */
  private buildTree(categories: any[]) {
    const map = new Map<string, any>();
    const roots: any[] = [];

    // Index tất cả categories theo id
    for (const cat of categories) {
      map.set(String(cat.id), { ...cat, children: [] });
    }

    for (const cat of categories) {
      const node = map.get(String(cat.id));
      if (cat.parent_id && map.has(String(cat.parent_id))) {
        map.get(String(cat.parent_id)).children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  /**
   * Kiểm tra xem targetId có phải là con cháu của ancestorId không.
   */
  private async isDescendant(
    targetId: number,
    ancestorId: number,
    userId: number,
  ): Promise<boolean> {
    const children = await this.prisma.category.findMany({
      where: { parent_id: BigInt(ancestorId), user_id: BigInt(userId), is_active: true },
      select: { id: true },
    });

    for (const child of children) {
      if (Number(child.id) === Number(targetId)) {
        return true;
      }
      const found = await this.isDescendant(targetId, Number(child.id), userId);
      if (found) return true;
    }

    return false;
  }
}
