import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse();
    // Bỏ qua wrapper nếu response là file binary (xuất Excel)
    if (res.getHeader('Content-Disposition')) {
      return next.handle();
    }
    return next.handle().pipe(
      map((payload) => {
        if (payload instanceof StreamableFile) return payload;
        if (payload && typeof payload === 'object' && 'success' in payload) {
          return payload;
        }
        return {
          success: true,
          message: payload?.message || 'Thao tác thành công',
          data: payload?.data !== undefined ? payload.data : payload,
          ...(payload?.meta && { meta: payload.meta }),
          errors: null,
        };
      }),
    );
  }
}
