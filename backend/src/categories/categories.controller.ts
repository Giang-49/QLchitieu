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
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { positiveInteger } from '../common/date-range';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@Request() req: any, @Query('type') type?: string) {
    return this.categoriesService.findAll(req.user.id, type);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(req.user.id, dto);
  }

  @Put(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(
      req.user.id,
      positiveInteger(id, 'Danh mục'),
      dto,
    );
  }

  @Delete(':id')
  remove(
    @Request() req: any,
    @Param('id') id: string,
    @Query('replace_id') replaceId?: string,
  ) {
    return this.categoriesService.remove(
      req.user.id,
      positiveInteger(id, 'Danh mục'),
      replaceId ? positiveInteger(replaceId, 'Danh mục thay thế') : undefined,
    );
  }
}
