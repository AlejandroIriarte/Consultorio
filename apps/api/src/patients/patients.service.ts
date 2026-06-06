import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import type {
  CreatePatientDto,
  UpdatePatientDto,
  SearchPatientDto,
  AddAllergyDto,
  AddMedicationDto,
} from '@consultorio/validators';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreatePatientDto, createdById: string) {
    if (dto.dni) {
      const existing = await this.prisma.patient.findUnique({
        where: { tenantId_dni: { tenantId, dni: dto.dni } },
      });
      if (existing) throw new ConflictException('Ya existe un paciente con ese DNI');
    }

    const qrCode = randomBytes(16).toString('hex');
    const { emergencyContact, ...patientData } = dto;

    return this.prisma.patient.create({
      data: {
        ...patientData,
        tenantId,
        qrCode,
        emergencyContacts: emergencyContact
          ? { create: emergencyContact }
          : undefined,
      },
      include: { emergencyContacts: true, allergies: true, medications: true },
    });
  }

  async findAll(tenantId: string, dto: SearchPatientDto) {
    const { q, page, limit } = dto;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      isActive: true,
      OR: [
        { firstName: { contains: q, mode: 'insensitive' as const } },
        { lastName: { contains: q, mode: 'insensitive' as const } },
        { dni: { contains: q } },
        { email: { contains: q, mode: 'insensitive' as const } },
        { phone: { contains: q } },
      ],
    };

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        select: {
          id: true, firstName: true, lastName: true,
          dni: true, phone: true, email: true, dateOfBirth: true,
          gender: true, qrCode: true, isActive: true,
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(tenantId: string, id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, tenantId },
      include: {
        emergencyContacts: true,
        allergies: true,
        medications: { where: { isActive: true } },
        consents: { orderBy: { signedAt: 'desc' }, take: 10 },
      },
    });
    if (!patient) throw new NotFoundException('Paciente no encontrado');
    return patient;
  }

  async findByQr(tenantId: string, qrCode: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { qrCode, tenantId, isActive: true },
      select: {
        id: true, firstName: true, lastName: true,
        dni: true, phone: true, bloodType: true, allergies: true,
      },
    });
    if (!patient) throw new NotFoundException('QR no válido');
    return patient;
  }

  async update(tenantId: string, id: string, dto: UpdatePatientDto) {
    await this.findOne(tenantId, id);
    const { emergencyContact, ...data } = dto;
    return this.prisma.patient.update({
      where: { id },
      data,
      include: { emergencyContacts: true, allergies: true },
    });
  }

  async archive(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.patient.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async addAllergy(tenantId: string, patientId: string, dto: AddAllergyDto) {
    await this.findOne(tenantId, patientId);
    return this.prisma.allergy.create({ data: { patientId, ...dto } });
  }

  async removeAllergy(tenantId: string, patientId: string, allergyId: string) {
    await this.findOne(tenantId, patientId);
    return this.prisma.allergy.delete({ where: { id: allergyId } });
  }

  async addMedication(tenantId: string, patientId: string, dto: AddMedicationDto) {
    await this.findOne(tenantId, patientId);
    return this.prisma.medication.create({ data: { patientId, ...dto } });
  }

  async getDocumentUploadUrl(_tenantId: string, _patientId: string) {
    // TODO: generate pre-signed S3 URL in Phase 3
    return { uploadUrl: '', key: '' };
  }

  async recordConsent(tenantId: string, patientId: string, type: string, ipAddress: string) {
    await this.findOne(tenantId, patientId);
    return this.prisma.patientConsent.create({
      data: { patientId, type, ipAddress },
    });
  }
}
