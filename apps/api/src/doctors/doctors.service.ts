import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import type {
  CreateDoctorDto, UpdateDoctorDto, SetAvailabilityDto,
  CreateScheduleBlockDto, CreateSpecialtyDto,
} from '@consultorio/validators';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  // ── Specialties ──────────────────────────────────

  async createSpecialty(tenantId: string, dto: CreateSpecialtyDto) {
    const existing = await this.prisma.specialty.findUnique({
      where: { tenantId_name: { tenantId, name: dto.name } },
    });
    if (existing) throw new ConflictException('Ya existe esa especialidad');
    return this.prisma.specialty.create({ data: { tenantId, ...dto } });
  }

  async listSpecialties(tenantId: string) {
    return this.prisma.specialty.findMany({
      where: { tenantId, isActive: true },
      include: { _count: { select: { doctors: true } } },
      orderBy: { name: 'asc' },
    });
  }

  // ── Doctors ───────────────────────────────────────

  async create(tenantId: string, dto: CreateDoctorDto) {
    const { specialtyIds, primarySpecialtyId, ...data } = dto;
    return this.prisma.doctor.create({
      data: {
        tenantId,
        ...data,
        specialties: {
          create: specialtyIds.map((id) => ({
            specialtyId: id,
            isPrimary: id === primarySpecialtyId,
          })),
        },
      },
      include: { specialties: { include: { specialty: true } }, user: true },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.doctor.findMany({
      where: { tenantId, isActive: true },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        specialties: { include: { specialty: true } },
        availability: { orderBy: { dayOfWeek: 'asc' } },
      },
      orderBy: { user: { lastName: 'asc' } },
    });
  }

  async findOne(tenantId: string, id: string) {
    const doctor = await this.prisma.doctor.findFirst({
      where: { id, tenantId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        specialties: { include: { specialty: true } },
        availability: { orderBy: { dayOfWeek: 'asc' } },
        scheduleBlocks: {
          where: { endAt: { gte: new Date() } },
          orderBy: { startAt: 'asc' },
        },
      },
    });
    if (!doctor) throw new NotFoundException('Médico no encontrado');
    return doctor;
  }

  async update(tenantId: string, id: string, dto: UpdateDoctorDto) {
    await this.findOne(tenantId, id);
    return this.prisma.doctor.update({ where: { id }, data: dto });
  }

  // ── Availability ──────────────────────────────────

  async setAvailability(tenantId: string, doctorId: string, dto: SetAvailabilityDto) {
    await this.findOne(tenantId, doctorId);
    // Replace entire availability schedule
    await this.prisma.availability.deleteMany({ where: { doctorId } });
    if (dto.slots.length === 0) return [];
    return this.prisma.availability.createMany({
      data: dto.slots.map((s) => ({ doctorId, ...s })),
    });
  }

  async getAvailability(tenantId: string, doctorId: string) {
    await this.findOne(tenantId, doctorId);
    return this.prisma.availability.findMany({
      where: { doctorId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  // ── Schedule blocks ───────────────────────────────

  async createScheduleBlock(tenantId: string, doctorId: string, dto: CreateScheduleBlockDto) {
    await this.findOne(tenantId, doctorId);
    return this.prisma.scheduleBlock.create({ data: { doctorId, ...dto } });
  }

  async deleteScheduleBlock(tenantId: string, doctorId: string, blockId: string) {
    await this.findOne(tenantId, doctorId);
    return this.prisma.scheduleBlock.delete({ where: { id: blockId } });
  }

  // ── Available slots computation ───────────────────

  async getAvailableSlots(tenantId: string, doctorId: string, date: string) {
    const doctor = await this.findOne(tenantId, doctorId);
    const day = new Date(date);
    const dayOfWeek = day.getDay();

    const schedule = doctor.availability.find((a) => a.dayOfWeek === dayOfWeek);
    if (!schedule) return [];

    // Check if date falls in a schedule block
    const blocked = doctor.scheduleBlocks.some(
      (b) => b.startAt <= day && b.endAt >= day,
    );
    if (blocked) return [];

    // Generate slots
    const slots: { startAt: string; endAt: string }[] = [];
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);
    const duration = schedule.slotDurationMinutes;

    let cursor = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (cursor + duration <= endMinutes) {
      const slotStart = new Date(date);
      slotStart.setHours(Math.floor(cursor / 60), cursor % 60, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);
      slots.push({ startAt: slotStart.toISOString(), endAt: slotEnd.toISOString() });
      cursor += duration;
    }

    // Remove already-booked slots
    const booked = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        doctorId,
        startAt: { gte: new Date(`${date}T00:00:00`), lt: new Date(`${date}T23:59:59`) },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      select: { startAt: true },
    });

    const bookedTimes = new Set(booked.map((a) => a.startAt.toISOString()));
    return slots.filter((s) => !bookedTimes.has(s.startAt));
  }
}
