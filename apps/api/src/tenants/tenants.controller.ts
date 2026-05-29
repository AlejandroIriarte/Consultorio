import { Controller, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateTenantSchema,
  UpdateTenantConfigSchema,
  type CreateTenantDto,
  type UpdateTenantConfigDto,
} from '@consultorio/validators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UserRole } from '@consultorio/database';
import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../common/guards/jwt-auth.guard';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Post()
  @SetMetadata(IS_PUBLIC_KEY, true)
  @ApiOperation({ summary: 'Crear nuevo consultorio (registro de tenant)' })
  create(@Body(new ZodValidationPipe(CreateTenantSchema)) dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Patch('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar configuración del consultorio' })
  updateConfig(
    @CurrentUser() user: { tenantId: string },
    @Body(new ZodValidationPipe(UpdateTenantConfigSchema)) dto: UpdateTenantConfigDto,
  ) {
    return this.tenantsService.updateConfig(user.tenantId, dto);
  }
}
