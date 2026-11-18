import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const address = '/api/v1/transactions/receipts/';
const validName = /^[0-9a-f-]{36}\.(?:png|jpg|webp)$/;
const folder = resolve(__dirname, '../../var/receipts');
const logger = new Logger('Receipts');
export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;

const MIME = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
} as const;

export interface ReceiptFile {
  buffer: Buffer;
}

function format(buffer: Buffer) {
  if (buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a')
    return 'png';
  if (buffer.subarray(0, 3).toString('hex') === 'ffd8ff') return 'jpg';
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  )
    return 'webp';
  throw new BadRequestException('Ảnh hóa đơn phải là PNG, JPEG hoặc WebP.');
}

export function isStoredReceipt(value?: string | null) {
  return (
    value?.startsWith(address) && validName.test(value.slice(address.length))
  );
}

export async function storeReceipt(userId: number, file: ReceiptFile) {
  if (file.buffer.length > RECEIPT_MAX_BYTES) {
    throw new BadRequestException('Ảnh hóa đơn không được vượt quá 5 MB.');
  }
  const filename = randomUUID() + '.' + format(file.buffer);
  const userFolder = join(folder, String(userId));
  await mkdir(userFolder, { recursive: true });
  await writeFile(join(userFolder, filename), file.buffer, { flag: 'wx' });
  return address + filename;
}

export async function getReceipt(userId: number, filename: string) {
  if (!validName.test(filename))
    throw new NotFoundException('Không tìm thấy ảnh hóa đơn.');
  try {
    const bytes = await readFile(join(folder, String(userId), filename));
    return { bytes, mime: MIME[filename.split('.')[1] as keyof typeof MIME] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new NotFoundException('Không tìm thấy ảnh hóa đơn.');
    }
    throw error;
  }
}

export async function discardReceipt(userId: number, value?: string | null) {
  if (!value || !isStoredReceipt(value)) return;
  try {
    await unlink(join(folder, String(userId), value.slice(address.length)));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.warn('Không thể dọn ảnh hóa đơn đã thay thế.');
    }
  }
}

export function validateReceiptLink(value: string | null | undefined) {
  const link = value?.trim();
  if (!link) return null;
  try {
    if (['http:', 'https:'].includes(new URL(link).protocol)) return link;
  } catch {
    // Báo lỗi chung cho URL sai cú pháp và giao thức không được hỗ trợ.
  }
  throw new BadRequestException(
    'Liên kết hóa đơn phải bắt đầu bằng http:// hoặc https://.',
  );
}
