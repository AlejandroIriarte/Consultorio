import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UserRole } from '@consultorio/database';
import {
  CreateDoctorSchema, UpdateDoctorSchema, SetAvailabilitySchema,
  CreateScheduleBlockSchema, CreateSpecialtySchema, GetSlotsSchema,
  type CreateDoctorDto, type UpdateDoctorDto, type SetAvailabilityDto,
  type CreateScheduleBlockDto, type CreateSpecialtyDto, type GetSlotsDto,
} from '@consultorio/validators';

type AuthUser = { id: string; tenantId: string; role: UserRole };

@ApiTags('doctors')
@ApiBearerAuth()
@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorsController {
  constructor(private doctorsService: DoctorsService) {}

  // ── Specialties ──────────────────────────────────

  @Post('specialties')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Crear especialidad' })
  createSpecialty(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateSpecialtySchema)) dto: CreateSpecialtyDto,
  ) {
    return this.doctorsService.createSpecialty(user.tenantId, dto);
  }

  @Get('specialties')
  @Roles(UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER, UserRole.PATIENT)
  @ApiOperation({ summary: 'Listar especialidades' })
  listSpecialties(@CurrentUser() user: AuthUser) {
    return this.doctorsService.listSpecialties(user.tenantId);
  }

  // ── Doctors ───────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Registrar médico' })
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateDoctorSchema)) dto: CreateDoctorDto,
  ) {
    return this.doctorsService.create(user.tenantId, dto);
  }

  @Get()
  @Roles(UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER, UserRole.PATIENT)
  @ApiOperation({ summary: 'Listar médicos' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.doctorsService.findAll(user.tenantId);
  }

  @Get('slots')
  @Roles(UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER, UserRole.PATIENT)
  @ApiOperation({ summary: 'Obtener turnos disponibles para una fecha' })
  getSlots(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(GetSlotsSchema)) query: GetSlotsDto,
  ) {
    return this.doctorsService.getAvailableSlots(user.tenantId, query.doctorId, query.date);
  }

  @Get(':id')
  @Roles(UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Ver perfil de médico' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.doctorsService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Editar médico' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateDoctorSchema)) dto: UpdateDoctorDto,
  ) {
    return this.doctorsService.update(user.tenantId, id, dto);
  }

  // ── Availability ──────────────────────────────────

  @Post(':id/availability')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Configurar disponibilidad horaria' })
  setAvailability(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SetAvailabilitySchema)) dto: SetAvailabilityDto,
  ) {
    return this.doctorsService.setAvailability(user.tenantId, id, dto);
  }

  @Get(':id/availability')
  @Roles(UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER, UserRole.PATIENT)
  @ApiOperation({ summary: 'Ver disponibilidad horaria' })
  getAvailability(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.doctorsService.getAvailability(user.tenantId, id);
  }

  // ── Schedule blocks ───────────────────────────────

  @Post(':id/blocks')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Bloquear agenda (vacaciones, licencia)' })
  createBlock(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateScheduleBlockSchema)) dto: CreateScheduleBlockDto,
  ) {
    return this.doctorsService.createScheduleBlock(user.tenantId, id, dto);
  }

  @Delete(':id/blocks/:blockId')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Eliminar bloqueo de agenda' })
  deleteBlock(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('blockId') blockId: string,
  ) {
    return this.doctorsService.deleteScheduleBlock(user.tenantId, id, blockId);
  }
}
