import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber({}, { message: 'wallet_id phải là số' })
  @IsNotEmpty({ message: 'wallet_id không được để trống' })
  wallet_id: number;

  @IsNumber({}, { message: 'category_id phải là số' })
  @IsNotEmpty({ message: 'category_id không được để trống' })
  category_id: number;

  @IsString()
  @IsNotEmpty({ message: 'Loại giao dịch (type) không được để trống' })
  type: string; // 'income' hoặc 'expense'

  @IsNumber({}, { message: 'Số tiền (amount) phải là số' })
  @IsNotEmpty({ message: 'Số tiền không được để trống' })
  amount: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsDateString({}, { message: 'Ngày giao dịch không đúng định dạng' })
  @IsNotEmpty({ message: 'Ngày giao dịch không được để trống' })
  transaction_date: string;
}