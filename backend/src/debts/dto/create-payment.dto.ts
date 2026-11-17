import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @Type(() => Number)
  @IsNumber()
  wallet_id: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Số tiền thanh toán phải lớn hơn 0' })
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;

  @IsOptional()
  @IsDateString()
  paid_at?: string;
}
