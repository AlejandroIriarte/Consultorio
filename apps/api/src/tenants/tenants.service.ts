import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma.service';
import type { CreateTenantDto, UpdateTenantConfigDto } from '@consultorio/validators';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({
      where: { slug, isActive: true },
      include: { config: true },
    });
  }

  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Ese slug ya está en uso');

    const passwordHash = await bcrypt.hash(dto.ownerPassword, 12);

    return this.prisma.tenant.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        config: {
          create: {},
        },
        users: {
          create: {
            email: dto.ownerEmail,
            passwordHash,
            firstName: dto.ownerFirstName,
            lastName: dto.ownerLastName,
            role: 'OWNER',
            isEmailVerified: false,
          },
        },
      },
      include: { config: true },
    });
  }

  async updateConfig(tenantId: string, dto: UpdateTenantConfigDto) {
    return this.prisma.tenantConfig.upsert({
      where: { tenantId },
      update: dto,
      create: { tenantId, ...dto },
    });
  }
}
