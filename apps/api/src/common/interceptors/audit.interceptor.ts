import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers } = req;

    const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (!isWriteOperation || !user) return next.handle();

    return next.handle().pipe(
      tap(() => {
        this.auditService.log({
          tenantId: user.tenantId,
          userId: user.id,
          action: `${method.toLowerCase()}:${url}`,
          ipAddress: ip,
          userAgent: headers['user-agent'],
        });
      }),
    );
  }
}
