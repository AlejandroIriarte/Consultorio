import { z } from 'zod';
export declare const CreateAppointmentSchema: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodObject<{
    patientId: z.ZodString;
    doctorId: z.ZodString;
    specialtyId: z.ZodOptional<z.ZodString>;
    startAt: z.ZodDate;
    endAt: z.ZodDate;
    notes: z.ZodOptional<z.ZodString>;
    isRecurring: z.ZodDefault<z.ZodBoolean>;
    recurrenceFrequency: z.ZodOptional<z.ZodEnum<["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]>>;
    recurrenceInterval: z.ZodOptional<z.ZodNumber>;
    recurrenceDays: z.ZodOptional<z.ZodArray<z.ZodEnum<["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]>, "many">>;
    recurrenceEndDate: z.ZodOptional<z.ZodDate>;
    recurrenceCount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    startAt: Date;
    endAt: Date;
    patientId: string;
    doctorId: string;
    isRecurring: boolean;
    notes?: string | undefined;
    specialtyId?: string | undefined;
    recurrenceFrequency?: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | undefined;
    recurrenceInterval?: number | undefined;
    recurrenceDays?: ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[] | undefined;
    recurrenceEndDate?: Date | undefined;
    recurrenceCount?: number | undefined;
}, {
    startAt: Date;
    endAt: Date;
    patientId: string;
    doctorId: string;
    notes?: string | undefined;
    specialtyId?: string | undefined;
    isRecurring?: boolean | undefined;
    recurrenceFrequency?: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | undefined;
    recurrenceInterval?: number | undefined;
    recurrenceDays?: ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[] | undefined;
    recurrenceEndDate?: Date | undefined;
    recurrenceCount?: number | undefined;
}>, {
    startAt: Date;
    endAt: Date;
    patientId: string;
    doctorId: string;
    isRecurring: boolean;
    notes?: string | undefined;
    specialtyId?: string | undefined;
    recurrenceFrequency?: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | undefined;
    recurrenceInterval?: number | undefined;
    recurrenceDays?: ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[] | undefined;
    recurrenceEndDate?: Date | undefined;
    recurrenceCount?: number | undefined;
}, {
    startAt: Date;
    endAt: Date;
    patientId: string;
    doctorId: string;
    notes?: string | undefined;
    specialtyId?: string | undefined;
    isRecurring?: boolean | undefined;
    recurrenceFrequency?: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | undefined;
    recurrenceInterval?: number | undefined;
    recurrenceDays?: ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[] | undefined;
    recurrenceEndDate?: Date | undefined;
    recurrenceCount?: number | undefined;
}>, {
    startAt: Date;
    endAt: Date;
    patientId: string;
    doctorId: string;
    isRecurring: boolean;
    notes?: string | undefined;
    specialtyId?: string | undefined;
    recurrenceFrequency?: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | undefined;
    recurrenceInterval?: number | undefined;
    recurrenceDays?: ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[] | undefined;
    recurrenceEndDate?: Date | undefined;
    recurrenceCount?: number | undefined;
}, {
    startAt: Date;
    endAt: Date;
    patientId: string;
    doctorId: string;
    notes?: string | undefined;
    specialtyId?: string | undefined;
    isRecurring?: boolean | undefined;
    recurrenceFrequency?: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | undefined;
    recurrenceInterval?: number | undefined;
    recurrenceDays?: ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[] | undefined;
    recurrenceEndDate?: Date | undefined;
    recurrenceCount?: number | undefined;
}>, {
    startAt: Date;
    endAt: Date;
    patientId: string;
    doctorId: string;
    isRecurring: boolean;
    notes?: string | undefined;
    specialtyId?: string | undefined;
    recurrenceFrequency?: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | undefined;
    recurrenceInterval?: number | undefined;
    recurrenceDays?: ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[] | undefined;
    recurrenceEndDate?: Date | undefined;
    recurrenceCount?: number | undefined;
}, {
    startAt: Date;
    endAt: Date;
    patientId: string;
    doctorId: string;
    notes?: string | undefined;
    specialtyId?: string | undefined;
    isRecurring?: boolean | undefined;
    recurrenceFrequency?: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | undefined;
    recurrenceInterval?: number | undefined;
    recurrenceDays?: ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[] | undefined;
    recurrenceEndDate?: Date | undefined;
    recurrenceCount?: number | undefined;
}>;
export declare const UpdateAppointmentStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["CONFIRMED", "WAITING_ROOM", "IN_CONSULTATION", "COMPLETED", "CANCELLED", "NO_SHOW"]>;
    cancelReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "CONFIRMED" | "WAITING_ROOM" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
    cancelReason?: string | undefined;
}, {
    status: "CONFIRMED" | "WAITING_ROOM" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
    cancelReason?: string | undefined;
}>;
export declare const GetSlotsSchema: z.ZodObject<{
    doctorId: z.ZodString;
    date: z.ZodString;
}, "strip", z.ZodTypeAny, {
    date: string;
    doctorId: string;
}, {
    date: string;
    doctorId: string;
}>;
export declare const ListAppointmentsSchema: z.ZodObject<{
    doctorId: z.ZodOptional<z.ZodString>;
    patientId: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
    from: z.ZodOptional<z.ZodDate>;
    to: z.ZodOptional<z.ZodDate>;
    status: z.ZodOptional<z.ZodEnum<["PENDING", "CONFIRMED", "WAITING_ROOM", "IN_CONSULTATION", "COMPLETED", "CANCELLED", "NO_SHOW"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "CONFIRMED" | "WAITING_ROOM" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "PENDING" | undefined;
    date?: string | undefined;
    patientId?: string | undefined;
    doctorId?: string | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
}, {
    status?: "CONFIRMED" | "WAITING_ROOM" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "PENDING" | undefined;
    date?: string | undefined;
    patientId?: string | undefined;
    doctorId?: string | undefined;
    from?: Date | undefined;
    to?: Date | undefined;
}>;
export type CreateAppointmentDto = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointmentStatusDto = z.infer<typeof UpdateAppointmentStatusSchema>;
export type GetSlotsDto = z.infer<typeof GetSlotsSchema>;
export type ListAppointmentsDto = z.infer<typeof ListAppointmentsSchema>;
//# sourceMappingURL=appointment.validators.d.ts.map