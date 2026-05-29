import { z } from 'zod';

export const CreateTenantSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Solo se permiten letras minúsculas, números y guiones'),
  ownerEmail: z.string().email(),
  ownerFirstName: z.string().min(1).max(100),
  ownerLastName: z.string().min(1).max(100),
  ownerPassword: z.string().min(8),
});

export const UpdateTenantConfigSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  address: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex inválido')
    .optional(),
});

export type CreateTenantDto = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantConfigDto = z.infer<typeof UpdateTenantConfigSchema>;
