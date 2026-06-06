import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UserRole } from '@consultorio/database';
import {
  CreatePatientSchema, UpdatePatientSchema, SearchPatientSchema,
  AddAllergySchema, AddMedicationSchema,
  type CreatePatientDto, type UpdatePatientDto, type SearchPatientDto,
  type AddAllergyDto, type AddMedicationDto,
} from '@consultorio/validators';

type AuthUser = { id: string; tenantId: string; role: UserRole };

@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Post()
  @Roles(UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Crear paciente' })
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreatePatientSchema)) dto: CreatePatientDto,
  ) {
    return this.patientsService.create(user.tenantId, dto, user.id);
  }

  @Get()
  @Roles(UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Buscar pacientes' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(SearchPatientSchema)) query: SearchPatientDto,
  ) {
    return this.patientsService.findAll(user.tenantId, query);
  }

  @Get('qr/:code')
  @Roles(UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Buscar paciente por QR' })
  findByQr(@CurrentUser() user: AuthUser, @Param('code') code: string) {
    return this.patientsService.findByQr(user.tenantId, code);
  }

  @Get(':id')
  @Roles(UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER, UserRole.PATIENT)
  @ApiOperation({ summary: 'Ver ficha de paciente' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.patientsService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Editar paciente' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePatientSchema)) dto: UpdatePatientDto,
  ) {
    return this.patientsService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Archivar paciente' })
  archive(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.patientsService.archive(user.tenantId, id);
  }

  @Post(':id/allergies')
  @Roles(UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Agregar alergia' })
  addAllergy(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AddAllergySchema)) dto: AddAllergyDto,
  ) {
    return this.patientsService.addAllergy(user.tenantId, id, dto);
  }

  @Delete(':id/allergies/:allergyId')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Eliminar alergia' })
  removeAllergy(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('allergyId') allergyId: string,
  ) {
    return this.patientsService.removeAllergy(user.tenantId, id, allergyId);
  }

  @Post(':id/medications')
  @Roles(UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Agregar medicamento activo' })
  addMedication(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AddMedicationSchema)) dto: AddMedicationDto,
  ) {
    return this.patientsService.addMedication(user.tenantId, id, dto);
  }

  @Post(':id/consents')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Registrar consentimiento firmado' })
  recordConsent(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('type') type: string,
    @Req() req: { ip: string },
  ) {
    return this.patientsService.recordConsent(user.tenantId, id, type, req.ip);
  }
}
