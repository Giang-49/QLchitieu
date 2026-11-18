import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Category } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { categoryBranch } from './category-tree';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const serializable = { isolationLevel: Prisma.TransactionIsolationLevel.Serializable };

function serialize(category: Category) {
  return {
    ...category,
    id: Number(category.id),
    user_id: Number(category.user_id),
    parent_id: category.parent_id === null ? null : Number(category.parent_id),
  };
}

type CategoryNode = ReturnType<typeof serialize> & { children: CategoryNode[] };

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number, type?: string) {
    if (type && !['income', 'expense'].includes(type)) {
      throw new BadRequestException('Loại danh mục phải là income hoặc expense.');
    }
    const rows = await this.prisma.category.findMany({
      where: { user_id: BigInt(userId), is_active: true, type: type || undefined },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    const nodes = new Map<number, CategoryNode>(
      rows.map(category => [Number(category.id), { ...serialize(category), children: [] }]),
    );
    const roots: CategoryNode[] = [];
    for (const node of nodes.values()) {
      const parent = node.parent_id ? nodes.get(node.parent_id) : undefined;
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
    return roots;
  }

  async create(userId: number, dto: CreateCategoryDto) {
    const owner = BigInt(userId);
    const name = dto.name.trim();
    const parent = dto.parent_id == null ? null : BigInt(dto.parent_id);
    const category = await this.prisma.$transaction(async (db) => {
      await this.checkName(db, owner, dto.type, name);
      if (parent !== null) await this.checkParent(db, owner, dto.type, parent);

      return db.category.create({
        data: {
          user_id: owner,
          type: dto.type,
          name,
          icon: dto.icon || 'tag',
          color: dto.color || '#1F4E79',
          parent_id: parent,
        },
      });
    }, serializable);
    return serialize(category);
  }

  async update(userId: number, id: number, dto: UpdateCategoryDto) {
    const owner = BigInt(userId);
    const categoryId = BigInt(id);
    const category = await this.prisma.$transaction(async (db) => {
      const current = await db.category.findFirst({
        where: { id: categoryId, user_id: owner, is_active: true },
      });
      if (!current) throw new NotFoundException('Danh mục không tồn tại.');
      if (dto.type != null && current.type !== dto.type) {
        throw new BadRequestException('Không thể đổi loại của danh mục đang dùng.');
      }

      const name = dto.name?.trim();
      if (name !== undefined && name !== current.name) {
        await this.checkName(db, owner, current.type, name, categoryId);
      }
      if (dto.parent_id != null) {
        const parent = BigInt(dto.parent_id);
        await this.checkParent(db, owner, current.type, parent);
        const tree = await db.category.findMany({
          where: { user_id: owner, is_active: true },
          select: { id: true, parent_id: true },
        });
        if (categoryBranch(tree, categoryId).includes(parent)) {
          throw new BadRequestException('Không thể đặt danh mục hiện tại hoặc danh mục con làm danh mục cha.');
        }
      }

      return db.category.update({
        where: { id: categoryId },
        data: {
          name,
          icon: dto.icon,
          color: dto.color,
          parent_id: dto.parent_id === undefined
            ? undefined
            : dto.parent_id === null ? null : BigInt(dto.parent_id),
        },
      });
    }, serializable);
    return serialize(category);
  }

  async remove(userId: number, id: number, replaceId?: number) {
    const owner = BigInt(userId);
    const categoryId = BigInt(id);
    return this.prisma.$transaction(async (db) => {
      const category = await db.category.findFirst({
        where: { id: categoryId, user_id: owner, is_active: true },
      });
      if (!category) throw new NotFoundException('Danh mục không tồn tại.');

      const where = { user_id: owner, category_id: categoryId };
      const transactionCount = await db.transaction.count({ where });
      if (transactionCount > 0) {
        if (replaceId == null || replaceId === id) {
          throw new BadRequestException('Hãy chọn danh mục thay thế cho các giao dịch đang sử dụng danh mục này.');
        }
        const replacement = await db.category.findFirst({
          where: { id: BigInt(replaceId), user_id: owner, type: category.type, is_active: true },
          select: { id: true },
        });
        if (!replacement) throw new BadRequestException('Danh mục thay thế phải tồn tại và cùng loại thu hoặc chi.');
        await db.transaction.updateMany({ where, data: { category_id: replacement.id } });
      }

      await db.category.updateMany({
        where: { user_id: owner, parent_id: categoryId },
        data: { parent_id: category.parent_id },
      });
      // Giữ lịch sử ngân sách và ẩn danh mục khỏi biểu mẫu giao dịch.
      await db.category.update({ where: { id: categoryId }, data: { is_active: false } });
      return {
        message: transactionCount
          ? 'Đã chuyển ' + transactionCount + ' giao dịch và ẩn danh mục'
          : 'Đã ẩn danh mục',
      };
    }, serializable);
  }

  private async checkName(
    db: Prisma.TransactionClient, owner: bigint, type: string, name: string, except?: bigint,
  ) {
    if (!name) throw new BadRequestException('Tên danh mục không được để trống.');
    const existing = await db.category.count({
      where: { user_id: owner, is_active: true, name, type, id: except === undefined ? undefined : { not: except } },
    });
    if (existing > 0) throw new BadRequestException('Danh mục cùng tên và loại đã tồn tại.');
  }

  private async checkParent(db: Prisma.TransactionClient, owner: bigint, type: string, id: bigint) {
    const parent = await db.category.findFirst({
      where: { id, user_id: owner, is_active: true, type },
      select: { id: true },
    });
    if (!parent) throw new BadRequestException('Danh mục cha phải tồn tại và cùng loại thu hoặc chi.');
  }
}
