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
    await this.prisma.auditLog.create({ data: params });
  }
}
