import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UserRole } from '@consultorio/database';
import {
  CreateAppointmentSchema, UpdateAppointmentStatusSchema, ListAppointmentsSchema,
  type CreateAppointmentDto, type UpdateAppointmentStatusDto, type ListAppointmentsDto,
} from '@consultorio/validators';

type AuthUser = { id: string; tenantId: string; role: UserRole };

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.OWNER, UserRole.PATIENT)
  @ApiOperation({ summary: 'Crear turno' })
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateAppointmentSchema)) dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(user.tenantId, dto, user.id);
  }

  @Get()
  @Roles(UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Listar turnos' })
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(ListAppointmentsSchema)) query: ListAppointmentsDto,
  ) {
    return this.appointmentsService.list(user.tenantId, query);
  }

  @Get('today/reception')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Turnos del día — vista recepción' })
  todayReception(@CurrentUser() user: AuthUser) {
    return this.appointmentsService.getTodayForReception(user.tenantId);
  }

  @Get('today/doctor')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Agenda del día — vista médico' })
  todayDoctor(@CurrentUser() user: AuthUser, @Query('doctorId') doctorId: string) {
    return this.appointmentsService.getTodayForDoctor(user.tenantId, doctorId);
  }

  @Get('my-today')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Agenda del día del médico autenticado (auto-resuelve doctorId)' })
  myToday(@CurrentUser() user: AuthUser) {
    return this.appointmentsService.getMyTodayForDoctor(user.id, user.tenantId);
  }

  @Get('my-history')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Historial de turnos del paciente autenticado (auto-resuelve patientId)' })
  myHistory(@CurrentUser() user: AuthUser) {
    return this.appointmentsService.getMyHistoryForPatient(user.id, user.tenantId);
  }

  @Get('stats/today')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Estadísticas del día para administradores' })
  statsToday(@CurrentUser() user: AuthUser) {
    return this.appointmentsService.getAdminStats(user.tenantId);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER, UserRole.PATIENT)
  @ApiOperation({ summary: 'Historial de turnos del paciente' })
  patientHistory(@CurrentUser() user: AuthUser, @Param('patientId') patientId: string) {
    return this.appointmentsService.getPatientHistory(user.tenantId, patientId);
  }

  @Get(':id')
  @Roles(UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER, UserRole.PATIENT)
  @ApiOperation({ summary: 'Ver turno' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.appointmentsService.findOne(user.tenantId, id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Cambiar estado del turno' })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateAppointmentStatusSchema)) dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(user.tenantId, id, dto);
  }

  @Post('waiting-list')
  @Roles(UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.OWNER, UserRole.PATIENT)
  @ApiOperation({ summary: 'Agregar a lista de espera' })
  addToWaitingList(
    @CurrentUser() user: AuthUser,
    @Body() body: { patientId: string; specialtyId?: string; preferredDoctorId?: string },
  ) {
    return this.appointmentsService.addToWaitingList(
      user.tenantId, body.patientId, body.specialtyId, body.preferredDoctorId,
    );
  }
}
