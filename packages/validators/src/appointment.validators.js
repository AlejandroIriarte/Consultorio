"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListAppointmentsSchema = exports.GetSlotsSchema = exports.UpdateAppointmentStatusSchema = exports.CreateAppointmentSchema = void 0;
const zod_1 = require("zod");
const RecurrenceFrequencyEnum = zod_1.z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']);
const DayOfWeekEnum = zod_1.z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);
exports.CreateAppointmentSchema = zod_1.z.object({
    patientId: zod_1.z.string().cuid(),
    doctorId: zod_1.z.string().cuid(),
    specialtyId: zod_1.z.string().cuid().optional(),
    startAt: zod_1.z.coerce.date(),
    endAt: zod_1.z.coerce.date(),
    notes: zod_1.z.string().max(500).optional(),
    isRecurring: zod_1.z.boolean().default(false),
    recurrenceFrequency: RecurrenceFrequencyEnum.optional(),
    recurrenceInterval: zod_1.z.number().int().min(1).max(12).optional(),
    recurrenceDays: zod_1.z.array(DayOfWeekEnum).optional(),
    recurrenceEndDate: zod_1.z.coerce.date().optional(),
    recurrenceCount: zod_1.z.number().int().min(1).max(52).optional(),
}).refine((d) => d.endAt > d.startAt, {
    message: 'La hora de fin debe ser posterior a la hora de inicio',
    path: ['endAt'],
}).refine((d) => {
    if (!d.isRecurring)
        return true;
    return !!d.recurrenceFrequency;
}, {
    message: 'Se requiere frecuencia para turnos recurrentes',
    path: ['recurrenceFrequency'],
}).refine((d) => {
    if (!d.isRecurring)
        return true;
    return !!d.recurrenceEndDate || !!d.recurrenceCount;
}, {
    message: 'Se requiere fecha de fin o cantidad de repeticiones',
    path: ['recurrenceEndDate'],
});
exports.UpdateAppointmentStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['CONFIRMED', 'WAITING_ROOM', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
    cancelReason: zod_1.z.string().max(255).optional(),
});
exports.GetSlotsSchema = zod_1.z.object({
    doctorId: zod_1.z.string().cuid(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD'),
});
exports.ListAppointmentsSchema = zod_1.z.object({
    doctorId: zod_1.z.string().cuid().optional(),
    patientId: zod_1.z.string().cuid().optional(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    from: zod_1.z.coerce.date().optional(),
    to: zod_1.z.coerce.date().optional(),
    status: zod_1.z.enum(['PENDING', 'CONFIRMED', 'WAITING_ROOM', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
});
//# sourceMappingURL=appointment.validators.js.map