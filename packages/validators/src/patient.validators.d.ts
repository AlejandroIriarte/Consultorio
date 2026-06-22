import { z } from 'zod';
export declare const CreatePatientSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    dni: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodDate>;
    gender: z.ZodOptional<z.ZodEnum<["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]>>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    address: z.ZodOptional<z.ZodString>;
    bloodType: z.ZodOptional<z.ZodEnum<["A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"]>>;
    notes: z.ZodOptional<z.ZodString>;
    emergencyContact: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        phone: z.ZodString;
        relation: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        phone: string;
        relation: string;
    }, {
        name: string;
        phone: string;
        relation: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    emergencyContact?: {
        name: string;
        phone: string;
        relation: string;
    } | undefined;
    email?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
    dni?: string | undefined;
    dateOfBirth?: Date | undefined;
    gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" | undefined;
    bloodType?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | undefined;
    notes?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    emergencyContact?: {
        name: string;
        phone: string;
        relation: string;
    } | undefined;
    email?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
    dni?: string | undefined;
    dateOfBirth?: Date | undefined;
    gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" | undefined;
    bloodType?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | undefined;
    notes?: string | undefined;
}>;
export declare const UpdatePatientSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    dni: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    dateOfBirth: z.ZodOptional<z.ZodOptional<z.ZodDate>>;
    gender: z.ZodOptional<z.ZodOptional<z.ZodEnum<["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]>>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    email: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    bloodType: z.ZodOptional<z.ZodOptional<z.ZodEnum<["A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"]>>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    emergencyContact: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        phone: z.ZodString;
        relation: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        phone: string;
        relation: string;
    }, {
        name: string;
        phone: string;
        relation: string;
    }>>>;
}, "strip", z.ZodTypeAny, {
    emergencyContact?: {
        name: string;
        phone: string;
        relation: string;
    } | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
    dni?: string | undefined;
    dateOfBirth?: Date | undefined;
    gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" | undefined;
    bloodType?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | undefined;
    notes?: string | undefined;
}, {
    emergencyContact?: {
        name: string;
        phone: string;
        relation: string;
    } | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    address?: string | undefined;
    phone?: string | undefined;
    dni?: string | undefined;
    dateOfBirth?: Date | undefined;
    gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY" | undefined;
    bloodType?: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | undefined;
    notes?: string | undefined;
}>;
export declare const SearchPatientSchema: z.ZodObject<{
    q: z.ZodString;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    q: string;
    page: number;
    limit: number;
}, {
    q: string;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const AddAllergySchema: z.ZodObject<{
    name: z.ZodString;
    severity: z.ZodEnum<["MILD", "MODERATE", "SEVERE"]>;
    reaction: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    severity: "MILD" | "MODERATE" | "SEVERE";
    reaction?: string | undefined;
}, {
    name: string;
    severity: "MILD" | "MODERATE" | "SEVERE";
    reaction?: string | undefined;
}>;
export declare const AddMedicationSchema: z.ZodObject<{
    name: z.ZodString;
    dose: z.ZodOptional<z.ZodString>;
    frequency: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name: string;
    dose?: string | undefined;
    frequency?: string | undefined;
    startDate?: Date | undefined;
}, {
    name: string;
    dose?: string | undefined;
    frequency?: string | undefined;
    startDate?: Date | undefined;
}>;
export type CreatePatientDto = z.infer<typeof CreatePatientSchema>;
export type UpdatePatientDto = z.infer<typeof UpdatePatientSchema>;
export type SearchPatientDto = z.infer<typeof SearchPatientSchema>;
export type AddAllergyDto = z.infer<typeof AddAllergySchema>;
export type AddMedicationDto = z.infer<typeof AddMedicationSchema>;
//# sourceMappingURL=patient.validators.d.ts.map