import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  IsDateString,
  IsInt,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  wallet_id: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Số tiền thanh toán phải lớn hơn 0' })
  @Max(9999999999999.99)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;

  @IsOptional()
  @IsDateString({ strict: true, strictSeparator: true })
  paid_at?: string;
}
