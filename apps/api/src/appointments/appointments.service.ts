import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  CreateAppointmentDto, UpdateAppointmentStatusDto, ListAppointmentsDto,
} from '@consultorio/validators';
import { AppointmentStatus, RecurrenceFrequency } from '@consultorio/database';

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

  private generateRecurringDates(dto: CreateAppointmentDto): Array<{ startAt: Date; endAt: Date }> {
    const slots: Array<{ startAt: Date; endAt: Date }> = [];
    const duration = dto.endAt.getTime() - dto.startAt.getTime();
    const freq = dto.recurrenceFrequency as RecurrenceFrequency;
    const interval = dto.recurrenceInterval ?? 1;
    const maxOccurrences = Math.min(dto.recurrenceCount ?? 52, 52);

    let current = new Date(dto.startAt);
    const endLimit = dto.recurrenceEndDate ?? null;

    while (slots.length < maxOccurrences) {
      // advance to next occurrence
      switch (freq) {
        case 'DAILY':   current = new Date(current.getTime() + interval * 86400000); break;
        case 'WEEKLY':  current = new Date(current.getTime() + interval * 7 * 86400000); break;
        case 'BIWEEKLY': current = new Date(current.getTime() + 2 * 7 * 86400000); break;
        case 'MONTHLY': {
          const next = new Date(current);
          next.setMonth(next.getMonth() + interval);
          current = next;
          break;
        }
      }

      if (endLimit && current > endLimit) break;

      // if specific days are required, skip dates that don't match
      if (dto.recurrenceDays && dto.recurrenceDays.length > 0) {
        const DAY_MAP: Record<string, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
        const dayNum = current.getDay();
        if (!dto.recurrenceDays.some((d) => DAY_MAP[d] === dayNum)) continue;
      }

      slots.push({ startAt: new Date(current), endAt: new Date(current.getTime() + duration) });
    }

    return slots;
  }

  async create(tenantId: string, dto: CreateAppointmentDto, createdById: string) {
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        doctorId: dto.doctorId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [{ startAt: { lt: dto.endAt }, endAt: { gt: dto.startAt } }],
      },
    });
    if (conflict) throw new ConflictException('El horario ya está ocupado');

    const { recurrenceFrequency, recurrenceInterval, recurrenceDays, recurrenceEndDate, recurrenceCount, ...baseData } = dto;

    const appointment = await this.prisma.appointment.create({
      data: {
        tenantId,
        createdById,
        ...baseData,
        ...(dto.isRecurring && {
          recurrenceFrequency: recurrenceFrequency as RecurrenceFrequency,
          recurrenceInterval,
          recurrenceDays: recurrenceDays ?? [],
          recurrenceEndDate,
          recurrenceCount,
        }),
      },
      include: {
        patient: { select: { firstName: true, lastName: true, email: true, phone: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        specialty: true,
      },
    });

    if (dto.isRecurring && recurrenceFrequency) {
      const childSlots = this.generateRecurringDates(dto);
      await this.prisma.appointment.createMany({
        data: childSlots.map((slot) => ({
          tenantId,
          createdById,
          patientId: dto.patientId,
          doctorId: dto.doctorId,
          specialtyId: dto.specialtyId,
          notes: dto.notes,
          recurringParentId: appointment.id,
          isRecurring: true,
          ...slot,
        })),
        skipDuplicates: true,
      });
    }

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
      // cascade cancel pending children of a recurring parent
      if (updated.isRecurring && !updated.recurringParentId) {
        await this.prisma.appointment.updateMany({
          where: {
            recurringParentId: updated.id,
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: dto.cancelReason },
        });
      }
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

  async getMyTodayForDoctor(userId: string, tenantId: string) {
    const doctor = await this.prisma.doctor.findFirst({ where: { userId, tenantId } });
    if (!doctor) throw new NotFoundException('No se encontró el perfil de médico');
    return this.getTodayForDoctor(tenantId, doctor.id);
  }

  async getMyHistoryForPatient(userId: string, tenantId: string) {
    const patient = await this.prisma.patient.findFirst({ where: { userId, tenantId } });
    if (!patient) throw new NotFoundException('No se encontró el perfil de paciente');
    return this.getPatientHistory(tenantId, patient.id);
  }

  async getAdminStats(tenantId: string) {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(`${today}T00:00:00`);
    const endOfDay = new Date(`${today}T23:59:59`);

    const [totalPatients, totalDoctors, todayTotal, todayCompleted, todayCancelled] =
      await this.prisma.$transaction([
        this.prisma.patient.count({ where: { tenantId, isActive: true } }),
        this.prisma.doctor.count({ where: { tenantId, isActive: true } }),
        this.prisma.appointment.count({ where: { tenantId, startAt: { gte: startOfDay, lt: endOfDay } } }),
        this.prisma.appointment.count({ where: { tenantId, startAt: { gte: startOfDay, lt: endOfDay }, status: 'COMPLETED' } }),
        this.prisma.appointment.count({ where: { tenantId, startAt: { gte: startOfDay, lt: endOfDay }, status: 'CANCELLED' } }),
      ]);

    return { totalPatients, totalDoctors, todayTotal, todayCompleted, todayCancelled };
  }

  async addToWaitingList(tenantId: string, patientId: string, specialtyId?: string, preferredDoctorId?: string) {
    return this.prisma.waitingList.create({
      data: { tenantId, patientId, specialtyId, preferredDoctorId },
    });
  }
}
