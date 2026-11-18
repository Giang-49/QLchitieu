import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsNumber,
  MaxLength,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWalletDto {
  @IsString({ message: 'Tên ví phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên ví không được để trống' })
  @MaxLength(100, { message: 'Tên ví tối đa 100 ký tự' })
  name: string;

  @IsOptional()
  @IsString()
  @IsIn(['cash', 'bank', 'ewallet'])
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999999.99)
  balance?: number;
}
