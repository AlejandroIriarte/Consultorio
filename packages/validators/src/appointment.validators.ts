import { z } from 'zod';

const RecurrenceFrequencyEnum = z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']);
const DayOfWeekEnum = z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);

export const CreateAppointmentSchema = z.object({
  patientId: z.string().cuid(),
  doctorId: z.string().cuid(),
  specialtyId: z.string().cuid().optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  notes: z.string().max(500).optional(),
  isRecurring: z.boolean().default(false),
  recurrenceFrequency: RecurrenceFrequencyEnum.optional(),
  recurrenceInterval: z.number().int().min(1).max(12).optional(),
  recurrenceDays: z.array(DayOfWeekEnum).optional(),
  recurrenceEndDate: z.coerce.date().optional(),
  recurrenceCount: z.number().int().min(1).max(52).optional(),
}).refine((d) => d.endAt > d.startAt, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['endAt'],
}).refine((d) => {
  if (!d.isRecurring) return true;
  return !!d.recurrenceFrequency;
}, {
  message: 'Se requiere frecuencia para turnos recurrentes',
  path: ['recurrenceFrequency'],
}).refine((d) => {
  if (!d.isRecurring) return true;
  return !!d.recurrenceEndDate || !!d.recurrenceCount;
}, {
  message: 'Se requiere fecha de fin o cantidad de repeticiones',
  path: ['recurrenceEndDate'],
});

export const UpdateAppointmentStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'WAITING_ROOM', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  cancelReason: z.string().max(255).optional(),
});

export const GetSlotsSchema = z.object({
  doctorId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
});

export const ListAppointmentsSchema = z.object({
  doctorId: z.string().cuid().optional(),
  patientId: z.string().cuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  status: z.enum(['PENDING','CONFIRMED','WAITING_ROOM','IN_CONSULTATION','COMPLETED','CANCELLED','NO_SHOW']).optional(),
});

export type CreateAppointmentDto = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointmentStatusDto = z.infer<typeof UpdateAppointmentStatusSchema>;
export type GetSlotsDto = z.infer<typeof GetSlotsSchema>;
export type ListAppointmentsDto = z.infer<typeof ListAppointmentsSchema>;
