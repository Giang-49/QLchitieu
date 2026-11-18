import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  IsPositive,
  IsIn,
  IsInt,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @Type(() => Number)
  @IsInt({ message: 'Ví phải là số nguyên' })
  @IsPositive()
  @IsNotEmpty({ message: 'wallet_id không được để trống' })
  wallet_id: number;

  @Type(() => Number)
  @IsInt({ message: 'Danh mục phải là số nguyên' })
  @IsPositive()
  @IsNotEmpty({ message: 'category_id không được để trống' })
  category_id: number;

  @IsString()
  @IsIn(['income', 'expense'], {
    message: 'Loại giao dịch phải là income hoặc expense',
  })
  @IsNotEmpty({ message: 'Loại giao dịch (type) không được để trống' })
  type: string; // 'income' hoặc 'expense'

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Số tiền chỉ có tối đa 2 chữ số thập phân' },
  )
  @Max(9999999999999.99)
  @IsPositive({ message: 'Số tiền phải lớn hơn 0' })
  @IsNotEmpty({ message: 'Số tiền không được để trống' })
  amount: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  image_url?: string;

  @IsDateString(
    { strict: true, strictSeparator: true },
    { message: 'Ngày giao dịch không đúng định dạng' },
  )
  @IsNotEmpty({ message: 'Ngày giao dịch không được để trống' })
  transaction_date: string;
}
