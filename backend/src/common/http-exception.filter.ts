import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const conflict =
      exception instanceof Prisma.PrismaClientKnownRequestError &&
      ['P2002', 'P2034'].includes(exception.code);
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : conflict
          ? HttpStatus.CONFLICT
          : HttpStatus.INTERNAL_SERVER_ERROR;
    if (status >= 500)
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );

    const exceptionResponse: any =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            message: conflict
              ? 'Dữ liệu vừa thay đổi. Vui lòng thử lại.'
              : 'Lỗi hệ thống nội bộ',
          };

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message[0]
          : exceptionResponse.message || 'Có lỗi xảy ra';

    response.status(status).json({
      success: false,
      message,
      data: null,
      errors:
        typeof exceptionResponse === 'object'
          ? exceptionResponse.message
          : null,
    });
  }
}
