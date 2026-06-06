import { z } from 'zod';

export const CreateAppointmentSchema = z.object({
  patientId: z.string().cuid(),
  doctorId: z.string().cuid(),
  specialtyId: z.string().cuid().optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  notes: z.string().max(500).optional(),
  isRecurring: z.boolean().default(false),
}).refine((d) => d.endAt > d.startAt, {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path: ['endAt'],
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
