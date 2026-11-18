import { IsNotEmpty, IsNumber, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBudgetDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  category_id: number;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Hạn mức phải lớn hơn 0' })
  @Max(9999999999999.99)
  @Type(() => Number)
  amount: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month: number;

  @IsNotEmpty()
  @IsInt()
  @Min(2000)
  @Max(9998)
  @Type(() => Number)
  year: number;
}
