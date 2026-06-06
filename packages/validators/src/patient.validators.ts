import { z } from 'zod';

export const CreatePatientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dni: z.string().max(20).optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(255).optional(),
  bloodType: z
    .enum(['A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE','AB_POSITIVE','AB_NEGATIVE','O_POSITIVE','O_NEGATIVE'])
    .optional(),
  notes: z.string().max(1000).optional(),
  emergencyContact: z
    .object({ name: z.string().min(1), phone: z.string().min(1), relation: z.string().min(1) })
    .optional(),
});

export const UpdatePatientSchema = CreatePatientSchema.partial();

export const SearchPatientSchema = z.object({
  q: z.string().min(1).max(100),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const AddAllergySchema = z.object({
  name: z.string().min(1).max(100),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
  reaction: z.string().max(255).optional(),
});

export const AddMedicationSchema = z.object({
  name: z.string().min(1).max(100),
  dose: z.string().max(50).optional(),
  frequency: z.string().max(50).optional(),
  startDate: z.coerce.date().optional(),
});

export type CreatePatientDto = z.infer<typeof CreatePatientSchema>;
export type UpdatePatientDto = z.infer<typeof UpdatePatientSchema>;
export type SearchPatientDto = z.infer<typeof SearchPatientSchema>;
export type AddAllergyDto = z.infer<typeof AddAllergySchema>;
export type AddMedicationDto = z.infer<typeof AddMedicationSchema>;
