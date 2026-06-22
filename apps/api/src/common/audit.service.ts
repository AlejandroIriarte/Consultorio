import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

interface LogActionParams {
  tenantId: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: LogActionParams): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        action: params.action,
        ...(params.userId && { userId: params.userId }),
        entityType: params.entityType,
        entityId: params.entityId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        oldValue: params.oldValue as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newValue: params.newValue as any,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }
}
