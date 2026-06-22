import { z } from 'zod';
export declare const CreateTenantSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    ownerEmail: z.ZodString;
    ownerFirstName: z.ZodString;
    ownerLastName: z.ZodString;
    ownerPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    ownerEmail: string;
    ownerFirstName: string;
    ownerLastName: string;
    ownerPassword: string;
}, {
    name: string;
    slug: string;
    ownerEmail: string;
    ownerFirstName: string;
    ownerLastName: string;
    ownerPassword: string;
}>;
export declare const UpdateTenantConfigSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    primaryColor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    email?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
    primaryColor?: string | undefined;
}, {
    name?: string | undefined;
    email?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
    primaryColor?: string | undefined;
}>;
export type CreateTenantDto = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantConfigDto = z.infer<typeof UpdateTenantConfigSchema>;
//# sourceMappingURL=tenant.validators.d.ts.map