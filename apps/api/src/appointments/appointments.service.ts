import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  CreateAppointmentDto, UpdateAppointmentStatusDto, ListAppointmentsDto,
} from '@consultorio/validators';
import { AppointmentStatus } from '@consultorio/database';

// Valid status transitions
const TRANSITIONS: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  PENDING:         ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:       ['WAITING_ROOM', 'CANCELLED', 'NO_SHOW'],
  WAITING_ROOM:    ['IN_CONSULTATION', 'CANCELLED'],
  IN_CONSULTATION: ['COMPLETED'],
};

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(tenantId: string, dto: CreateAppointmentDto, createdById: string) {
    // Check slot is not already taken
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        doctorId: dto.doctorId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          { startAt: { lt: dto.endAt }, endAt: { gt: dto.startAt } },
        ],
      },
    });
    if (conflict) throw new ConflictException('El horario ya está ocupado');

    const appointment = await this.prisma.appointment.create({
      data: { tenantId, createdById, ...dto },
      include: {
        patient: { select: { firstName: true, lastName: true, email: true, phone: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        specialty: true,
      },
    });

    await this.notifications.scheduleAppointmentReminders(appointment);
    await this.notifications.sendAppointmentConfirmation(appointment);

    return appointment;
  }

  async list(tenantId: string, dto: ListAppointmentsDto) {
    const { doctorId, patientId, date, from, to, status } = dto;

    const dateFilter = date
      ? { gte: new Date(`${date}T00:00:00`), lt: new Date(`${date}T23:59:59`) }
      : from || to
        ? { ...(from && { gte: from }), ...(to && { lte: to }) }
        : undefined;

    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        ...(doctorId && { doctorId }),
        ...(patientId && { patientId }),
        ...(dateFilter && { startAt: dateFilter }),
        ...(status && { status }),
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        specialty: { select: { id: true, name: true, color: true } },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        patient: true,
        doctor: { include: { user: true, specialties: { include: { specialty: true } } } },
        specialty: true,
      },
    });
    if (!appt) throw new NotFoundException('Turno no encontrado');
    return appt;
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateAppointmentStatusDto) {
    const appt = await this.findOne(tenantId, id);

    const allowed = TRANSITIONS[appt.status];
    if (!allowed?.includes(dto.status as AppointmentStatus)) {
      throw new BadRequestException(
        `No se puede cambiar de ${appt.status} a ${dto.status}`,
      );
    }

    const timestamps: Record<string, Date> = {
      CONFIRMED:       { confirmedAt: new Date() } as any,
      WAITING_ROOM:    { arrivedAt: new Date() } as any,
      IN_CONSULTATION: { startedAt: new Date() } as any,
      COMPLETED:       { completedAt: new Date() } as any,
      CANCELLED:       { cancelledAt: new Date() } as any,
    };

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: dto.status as AppointmentStatus,
        cancelReason: dto.cancelReason,
        ...timestamps[dto.status],
      },
      include: {
        patient: { select: { firstName: true, lastName: true, email: true, phone: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    if (dto.status === 'CANCELLED') {
      await this.notifications.sendCancellationNotification(updated);
    }

    if (dto.status === 'WAITING_ROOM') {
      await this.notifications.notifyDoctorPatientArrived(updated);
    }

    return updated;
  }

  async getTodayForDoctor(tenantId: string, doctorId: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.list(tenantId, { doctorId, date: today });
  }

  async getTodayForReception(tenantId: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.list(tenantId, { date: today });
  }

  async getPatientHistory(tenantId: string, patientId: string) {
    return this.list(tenantId, { patientId });
  }

  async addToWaitingList(tenantId: string, patientId: string, specialtyId?: string, preferredDoctorId?: string) {
    return this.prisma.waitingList.create({
      data: { tenantId, patientId, specialtyId, preferredDoctorId },
    });
  }
}
