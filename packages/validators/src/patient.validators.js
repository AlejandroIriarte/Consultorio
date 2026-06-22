"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMedicationSchema = exports.AddAllergySchema = exports.SearchPatientSchema = exports.UpdatePatientSchema = exports.CreatePatientSchema = void 0;
const zod_1 = require("zod");
exports.CreatePatientSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(100),
    lastName: zod_1.z.string().min(1).max(100),
    dni: zod_1.z.string().max(20).optional(),
    dateOfBirth: zod_1.z.coerce.date().optional(),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    phone: zod_1.z.string().max(20).optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    address: zod_1.z.string().max(255).optional(),
    bloodType: zod_1.z
        .enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'])
        .optional(),
    notes: zod_1.z.string().max(1000).optional(),
    emergencyContact: zod_1.z
        .object({ name: zod_1.z.string().min(1), phone: zod_1.z.string().min(1), relation: zod_1.z.string().min(1) })
        .optional(),
});
exports.UpdatePatientSchema = exports.CreatePatientSchema.partial();
exports.SearchPatientSchema = zod_1.z.object({
    q: zod_1.z.string().min(1).max(100),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
});
exports.AddAllergySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    severity: zod_1.z.enum(['MILD', 'MODERATE', 'SEVERE']),
    reaction: zod_1.z.string().max(255).optional(),
});
exports.AddMedicationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    dose: zod_1.z.string().max(50).optional(),
    frequency: zod_1.z.string().max(50).optional(),
    startDate: zod_1.z.coerce.date().optional(),
});
//# sourceMappingURL=patient.validators.js.map