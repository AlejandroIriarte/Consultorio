import { z } from 'zod';
export declare const CreateDoctorSchema: z.ZodObject<{
    userId: z.ZodString;
    licenseNumber: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    specialtyIds: z.ZodArray<z.ZodString, "many">;
    primarySpecialtyId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    specialtyIds: string[];
    primarySpecialtyId: string;
    licenseNumber?: string | undefined;
    bio?: string | undefined;
}, {
    userId: string;
    specialtyIds: string[];
    primarySpecialtyId: string;
    licenseNumber?: string | undefined;
    bio?: string | undefined;
}>;
export declare const UpdateDoctorSchema: z.ZodObject<{
    licenseNumber: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    licenseNumber?: string | undefined;
    bio?: string | undefined;
}, {
    licenseNumber?: string | undefined;
    bio?: string | undefined;
}>;
export declare const SetAvailabilitySchema: z.ZodObject<{
    slots: z.ZodArray<z.ZodObject<{
        dayOfWeek: z.ZodNumber;
        startTime: z.ZodString;
        endTime: z.ZodString;
        slotDurationMinutes: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        slotDurationMinutes: number;
    }, {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        slotDurationMinutes?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    slots: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        slotDurationMinutes: number;
    }[];
}, {
    slots: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        slotDurationMinutes?: number | undefined;
    }[];
}>;
export declare const CreateScheduleBlockSchema: z.ZodEffects<z.ZodObject<{
    startAt: z.ZodDate;
    endAt: z.ZodDate;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startAt: Date;
    endAt: Date;
    reason?: string | undefined;
}, {
    startAt: Date;
    endAt: Date;
    reason?: string | undefined;
}>, {
    startAt: Date;
    endAt: Date;
    reason?: string | undefined;
}, {
    startAt: Date;
    endAt: Date;
    reason?: string | undefined;
}>;
export declare const CreateSpecialtySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    color?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    color?: string | undefined;
}>;
export type CreateDoctorDto = z.infer<typeof CreateDoctorSchema>;
export type UpdateDoctorDto = z.infer<typeof UpdateDoctorSchema>;
export type SetAvailabilityDto = z.infer<typeof SetAvailabilitySchema>;
export type CreateScheduleBlockDto = z.infer<typeof CreateScheduleBlockSchema>;
export type CreateSpecialtyDto = z.infer<typeof CreateSpecialtySchema>;
//# sourceMappingURL=doctor.validators.d.ts.map