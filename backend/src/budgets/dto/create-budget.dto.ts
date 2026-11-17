import { IsNotEmpty, IsNumber, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBudgetDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  category_id: number;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'amount must be greater than 0' })
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
  @Type(() => Number)
  year: number;
}
