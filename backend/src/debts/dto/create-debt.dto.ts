import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsIn,
  MaxLength,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDebtDto {
  @Type(() => Number)
  @IsNumber()
  wallet_id: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['lend', 'borrow'])
  type: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  person_name: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Số tiền phải lớn hơn 0' })
  amount: number;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
