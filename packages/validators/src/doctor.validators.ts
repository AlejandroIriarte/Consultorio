import { z } from 'zod';

export const CreateDoctorSchema = z.object({
  userId: z.string().cuid(),
  licenseNumber: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  specialtyIds: z.array(z.string().cuid()).min(1, 'Debe tener al menos una especialidad'),
  primarySpecialtyId: z.string().cuid(),
});

export const UpdateDoctorSchema = z.object({
  licenseNumber: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
});

export const SetAvailabilitySchema = z.object({
  slots: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:MM'),
      endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:MM'),
      slotDurationMinutes: z.number().int().min(10).max(120).default(30),
    })
  ),
});

export const CreateScheduleBlockSchema = z.object({
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  reason: z.string().max(100).optional(),
}).refine((d) => d.endAt > d.startAt, {
  message: 'La fecha fin debe ser posterior a la fecha inicio',
  path: ['endAt'],
});

export const CreateSpecialtySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(255).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export type CreateDoctorDto = z.infer<typeof CreateDoctorSchema>;
export type UpdateDoctorDto = z.infer<typeof UpdateDoctorSchema>;
export type SetAvailabilityDto = z.infer<typeof SetAvailabilitySchema>;
export type CreateScheduleBlockDto = z.infer<typeof CreateScheduleBlockSchema>;
export type CreateSpecialtyDto = z.infer<typeof CreateSpecialtySchema>;
