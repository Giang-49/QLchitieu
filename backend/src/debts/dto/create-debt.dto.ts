import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsIn,
  MaxLength,
  Min,
  IsDateString,
  IsInt,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDebtDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
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
  @Max(9999999999999.99)
  amount: number;

  @IsNotEmpty({ message: 'Vui lòng chọn ngày hẹn trả' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Ngày hẹn trả phải có dạng YYYY-MM-DD',
  })
  @IsDateString({ strict: true })
  due_date: string;

  @IsOptional()
  @IsString()
  note?: string;
}
