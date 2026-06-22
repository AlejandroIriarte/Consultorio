"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTenantConfigSchema = exports.CreateTenantSchema = void 0;
const zod_1 = require("zod");
exports.CreateTenantSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
    slug: zod_1.z
        .string()
        .min(3)
        .max(50)
        .regex(/^[a-z0-9-]+$/, 'Solo se permiten letras minúsculas, números y guiones'),
    ownerEmail: zod_1.z.string().email(),
    ownerFirstName: zod_1.z.string().min(1).max(100),
    ownerLastName: zod_1.z.string().min(1).max(100),
    ownerPassword: zod_1.z.string().min(8),
});
exports.UpdateTenantConfigSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    address: zod_1.z.string().max(255).optional(),
    phone: zod_1.z.string().max(20).optional(),
    email: zod_1.z.string().email().optional(),
    primaryColor: zod_1.z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex inválido')
        .optional(),
});
//# sourceMappingURL=tenant.validators.js.map