"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Verify2FASchema = exports.ResetPasswordSchema = exports.ForgotPasswordSchema = exports.VerifyEmailSchema = exports.RefreshTokenSchema = exports.LoginSchema = exports.RegisterSchema = void 0;
const zod_1 = require("zod");
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número')
        .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
    firstName: zod_1.z.string().min(1, 'El nombre es requerido').max(100),
    lastName: zod_1.z.string().min(1, 'El apellido es requerido').max(100),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(1, 'La contraseña es requerida'),
    totpCode: zod_1.z.string().length(6).optional(),
});
exports.RefreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1),
});
exports.VerifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
});
exports.ForgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
});
exports.ResetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    password: zod_1.z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número')
        .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
});
exports.Verify2FASchema = zod_1.z.object({
    totpCode: zod_1.z.string().length(6, 'El código debe tener 6 dígitos'),
});
//# sourceMappingURL=auth.validators.js.map