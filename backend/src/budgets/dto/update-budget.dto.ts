import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBudgetDto {
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Hạn mức phải lớn hơn 0' })
  @Max(9999999999999.99)
  @Type(() => Number)
  amount: number;
}
