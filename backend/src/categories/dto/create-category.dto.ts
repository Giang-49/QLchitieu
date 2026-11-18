import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsIn,
  MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: 'Tên danh mục phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @MaxLength(100, { message: 'Tên danh mục tối đa 100 ký tự' })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Icon tối đa 50 ký tự' })
  icon?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Màu tối đa 20 ký tự' })
  color?: string;

  @IsString({ message: 'Loại danh mục phải là chuỗi' })
  @IsNotEmpty({ message: 'Loại danh mục không được để trống' })
  @IsIn(['income', 'expense'], {
    message: 'Loại danh mục phải là income hoặc expense',
  })
  type: string;

  @IsInt({ message: 'Danh mục cha phải là số nguyên' })
  @Min(1)
  @IsOptional()
  parent_id?: number;
}
