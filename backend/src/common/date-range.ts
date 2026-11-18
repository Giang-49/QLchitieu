import { BadRequestException } from '@nestjs/common';
import { isISO8601 } from 'class-validator';

export function dateRange(from?: string, to?: string) {
  const parse = (value: string, end: boolean) => {
    if (
      typeof value !== 'string' ||
      !isISO8601(value, { strict: true, strictSeparator: true })
    ) {
      throw new BadRequestException('Ngày lọc không hợp lệ.');
    }
    const date = new Date(
      end && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? value + 'T23:59:59.999Z'
        : value,
    );
    if (!Number.isFinite(date.getTime()))
      throw new BadRequestException('Ngày lọc không hợp lệ.');
    return date;
  };
  const gte = from !== undefined ? parse(from, false) : undefined;
  const lte = to !== undefined ? parse(to, true) : undefined;
  if (gte && lte && gte > lte)
    throw new BadRequestException(
      'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.',
    );
  return gte || lte ? { gte, lte } : undefined;
}

export function positiveInteger(
  value: string,
  label: string,
  max = Number.MAX_SAFE_INTEGER,
) {
  const number = Number(value);
  if (
    !/^\d+$/.test(value) ||
    !Number.isSafeInteger(number) ||
    number < 1 ||
    number > max
  ) {
    throw new BadRequestException(`${label} không hợp lệ.`);
  }
  return number;
}

export function vietnamToday() {
  const date = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date());
  return new Date(date + 'T00:00:00.000Z');
}
