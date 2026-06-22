"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSpecialtySchema = exports.CreateScheduleBlockSchema = exports.SetAvailabilitySchema = exports.UpdateDoctorSchema = exports.CreateDoctorSchema = void 0;
const zod_1 = require("zod");
exports.CreateDoctorSchema = zod_1.z.object({
    userId: zod_1.z.string().cuid(),
    licenseNumber: zod_1.z.string().max(50).optional(),
    bio: zod_1.z.string().max(500).optional(),
    specialtyIds: zod_1.z.array(zod_1.z.string().cuid()).min(1, 'Debe tener al menos una especialidad'),
    primarySpecialtyId: zod_1.z.string().cuid(),
});
exports.UpdateDoctorSchema = zod_1.z.object({
    licenseNumber: zod_1.z.string().max(50).optional(),
    bio: zod_1.z.string().max(500).optional(),
});
exports.SetAvailabilitySchema = zod_1.z.object({
    slots: zod_1.z.array(zod_1.z.object({
        dayOfWeek: zod_1.z.number().int().min(0).max(6),
        startTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:MM'),
        endTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/, 'Formato: HH:MM'),
        slotDurationMinutes: zod_1.z.number().int().min(10).max(120).default(30),
    })),
});
exports.CreateScheduleBlockSchema = zod_1.z.object({
    startAt: zod_1.z.coerce.date(),
    endAt: zod_1.z.coerce.date(),
    reason: zod_1.z.string().max(100).optional(),
}).refine((d) => d.endAt > d.startAt, {
    message: 'La fecha fin debe ser posterior a la fecha inicio',
    path: ['endAt'],
});
exports.CreateSpecialtySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(255).optional(),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});
//# sourceMappingURL=doctor.validators.js.map