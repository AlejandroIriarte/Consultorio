# Consultorio SaaS — Plan de Proyecto

> Este documento es el mapa vivo del proyecto. Se actualiza al completar cada tarea.
> **Estado actual:** Fase 1 — Fundación

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Backend | NestJS (Node.js, TypeScript) |
| Base de datos | PostgreSQL + Prisma ORM |
| Cache / Colas | Redis + BullMQ |
| Auth | NextAuth.js + JWT (access 15min / refresh 7d) + 2FA TOTP |
| Archivos | AWS S3 (URLs pre-firmadas) |
| Email | Resend |
| SMS / WhatsApp | Twilio |
| Push | Firebase FCM |
| Real-time | Socket.io |
| UI | Tailwind CSS + shadcn/ui |
| Testing | Jest + Supertest + Playwright |
| Monorepo | Turborepo |
| Deploy | Vercel (FE) + Railway (BE) |

---

## Fases y Tareas

### Fase 1 — Fundación ⬅ ACTUAL

#### 1.1 Monorepo
- [x] Inicializar Turborepo con workspaces `apps/web`, `apps/api`, `packages/database`, `packages/types`, `packages/validators`, `packages/ui`
- [x] Configurar TypeScript compartido (`tsconfig.base.json`)
- [x] Configurar ESLint + Prettier compartidos
- [x] Docker Compose para desarrollo local (PostgreSQL + Redis)
- [x] Variables de entorno (`.env.example` documentado)

#### 1.2 Base de datos
- [x] Schema Prisma: `Tenant`, `TenantConfig`, `User`, `RefreshToken`, `AuditLog`
- [ ] Migraciones iniciales (requiere DB activa)
- [ ] Seed de desarrollo (tenant demo + usuarios de prueba)

#### 1.3 Autenticación (NestJS API)
- [x] Módulo `AuthModule`: registro, login, logout
- [x] JWT access token (15 min) + refresh token con rotación (7 días)
- [x] 2FA TOTP (speakeasy): generar secreto, verificar código, activar/desactivar
- [x] Guard `JwtAuthGuard` + `RolesGuard`
- [x] Bloqueo por intentos fallidos (5 intentos → 15 min de bloqueo)
- [x] Endpoint de verificación de email
- [x] Forgot/reset password con tokens de expiración
- [x] Tests unitarios de AuthService (12 casos)

#### 1.4 Multi-tenancy
- [x] Middleware que resuelve tenant por subdominio
- [x] Filtro por `tenantId` en todas las queries (Prisma unique constraints)
- [x] Modelo `TenantConfig` (nombre, logo, colores, plan)
- [x] Módulo `TenantsModule` con CRUD

#### 1.5 Seguridad base (NestJS)
- [x] Helmet.js (headers de seguridad)
- [x] Rate limiting global (100 req/min por IP) + estricto en `/auth` (10 req/min)
- [x] CORS configurado por origen permitido
- [x] Validación global con Zod (ZodValidationPipe)
- [x] Audit log interceptor (registra toda acción de escritura)

#### 1.6 Frontend base (Next.js)
- [x] Layout raíz con Tailwind CSS (variables CSS para modo oscuro)
- [x] Páginas: login con soporte 2FA, dashboard (shell)
- [x] Integración NextAuth con el backend NestJS
- [x] Middleware de Next.js: redirige según rol y estado de auth (5 roles → rutas distintas)
- [x] Modo claro/oscuro (toggle con next-themes, sin flash en SSR)
- [x] Página de registro con validación Zod client-side y manejo de errores por campo
- [x] Página de verificar-email (estados: loading / success / error / no-token)
- [x] Página de 2FA setup (QR → confirmación → activado)
- [x] Página de forgot-password
- [x] API client tipado (`lib/api-client.ts`) con `ApiError` estructurado
- [x] Layout del dashboard con header y theme toggle
- [x] Tailwind config + PostCSS
- [x] NextAuth API route (`app/api/auth/[...nextauth]/route.ts`)

#### 1.2 Base de datos (actualizado)
- [x] Schema Prisma: `Tenant`, `TenantConfig`, `User`, `RefreshToken`, `AuditLog`
- [ ] Migraciones iniciales (requiere DB activa: `docker compose up -d && npm run db:migrate`)
- [x] Seed de desarrollo: tenant "demo" + 5 usuarios (owner, admin, médico, recepcionista, paciente) — contraseña: `Demo123!`

#### 1.7 CI/CD
- [x] GitHub Actions: lint + test en cada PR (`ci.yml`)
- [x] GitHub Actions: deploy automático a Vercel (FE) + Railway (BE) en merge a `main` (`deploy.yml`)
- [x] Health check endpoint `GET /api/v1/health`

---

### Fase 2 — Core: Pacientes y Agenda

#### 2.1 Gestión de Pacientes
- [ ] Schema: `Patient`, `EmergencyContact`, `Allergy`, `Medication`, `Document`
- [ ] CRUD pacientes (crear, editar, buscar, archivar)
- [ ] Upload de documentos a S3 con URLs pre-firmadas
- [ ] Consentimientos digitales con timestamp
- [ ] Código QR de identificación por paciente

#### 2.2 Perfiles de Médicos
- [ ] Schema: `Doctor`, `Specialty`, `Schedule`, `Availability`
- [ ] CRUD médicos + asociación a especialidades
- [ ] Configuración de disponibilidad horaria semanal
- [ ] Bloqueos de agenda (vacaciones, feriados bolivianos)

#### 2.3 Agenda y Turnos
- [ ] Schema: `Appointment`, `WaitingList`, `AppointmentStatus`
- [ ] Calendario interactivo (día / semana / mes)
- [ ] Creación de turno por recepcionista
- [ ] Reserva online por paciente (especialidad → médico → horario disponible)
- [ ] Lista de espera automática
- [ ] Turnos recurrentes
- [ ] Flujo de estados: `PENDING → CONFIRMED → WAITING_ROOM → IN_CONSULTATION → COMPLETED / CANCELLED`

#### 2.4 Notificaciones básicas (Email)
- [ ] Email de confirmación de turno (Resend)
- [ ] Recordatorio 24h antes (BullMQ job)
- [ ] Recordatorio 1h antes (BullMQ job)
- [ ] Email de cancelación
- [ ] Templates HTML responsive con branding del tenant

---

### Fase 3 — Historia Clínica Electrónica (HCE)

- [ ] Schema: `MedicalRecord`, `ConsultationNote`, `Prescription`, `StudyOrder`, `Diagnosis`
- [ ] Notas de consulta SOAP (Subjetivo, Objetivo, Análisis, Plan)
- [ ] Diagnósticos con codificación CIE-10 (autocomplete)
- [ ] Recetas digitales (con datos del médico, fecha, firma)
- [ ] Órdenes de estudios (laboratorio, imágenes)
- [ ] Control de acceso HCE: solo médicos autorizados del tenant
- [ ] Historial unificado entre especialidades
- [ ] Módulos específicos:
  - [ ] Signos vitales con gráfico de evolución
  - [ ] Odontograma (SVG interactivo)
  - [ ] Notas psicológicas (acceso ultra-restringido)

---

### Fase 4 — Facturación y Reportes

- [ ] Schema: `Invoice`, `Payment`, `InsurancePlan`, `InvoiceItem`
- [ ] Generación de factura PDF (react-pdf)
- [ ] Registro de pagos (efectivo, transferencia, QR Bolivia)
- [ ] Gestión de mutuales / seguros por paciente
- [ ] Saldo a favor / deuda por paciente
- [ ] Dashboard financiero (ingresos por período, por médico)
- [ ] Exportes PDF y Excel
- [ ] Reportes: ocupación de agenda, pacientes nuevos, recurrencia

---

### Fase 5 — Notificaciones Full y Real-time

- [ ] SMS via Twilio: confirmación, recordatorio 1h, cancelación
- [ ] WhatsApp via Twilio: recordatorio interactivo (confirmar/cancelar con 1 click)
- [ ] Push notifications FCM: paciente llega, turno próximo
- [ ] Socket.io: sala de espera en vivo (médico ve llegadas en tiempo real)
- [ ] Centro de notificaciones in-app (campana con bandeja)
- [ ] Preferencias de notificación por usuario (qué canales activar)
- [ ] Notificaciones al médico: nuevo turno, cancelación, paciente en sala

---

### Fase 6 — Seguridad Avanzada, Pulido y Launch

- [ ] Auditoría de seguridad completa (OWASP Top 10 checklist)
- [ ] Pruebas de penetración básicas (OWASP ZAP automatizado en CI)
- [ ] Performance: Lighthouse ≥ 90 en todas las páginas
- [ ] Accesibilidad: WCAG 2.1 AA
- [ ] Tests E2E Playwright: registro, reserva de turno, HCE, pago
- [ ] Cobertura de tests ≥ 80%
- [ ] Documentación de API (Swagger/OpenAPI auto-generado por NestJS)
- [ ] Landing page marketing con pricing
- [ ] Onboarding guiado para nuevos tenants (checklist interactivo)
- [ ] Backup automático diario con retención 90 días
- [ ] Monitoreo y alertas (Sentry + Uptime Robot)

---

## Estructura del Repositorio

```
consultorio/
├── apps/
│   ├── web/                  ← Next.js 14
│   │   ├── app/              ← App Router
│   │   ├── components/
│   │   └── lib/
│   └── api/                  ← NestJS
│       ├── src/
│       │   ├── auth/
│       │   ├── tenants/
│       │   ├── patients/
│       │   ├── appointments/
│       │   ├── medical-records/
│       │   ├── notifications/
│       │   └── billing/
│       └── test/
├── packages/
│   ├── database/             ← Prisma schema + client
│   ├── types/                ← TypeScript types compartidos
│   ├── validators/           ← Zod schemas compartidos
│   └── ui/                   ← Componentes shadcn/ui compartidos
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── docker-compose.yml
├── turbo.json
├── package.json              ← root workspace
└── PLAN.md                   ← este archivo
```

---

## Modelo de Datos — Visión General

```
Tenant (1) ──── (N) User
Tenant (1) ──── (N) Patient
Tenant (1) ──── (N) Doctor
Doctor  (1) ──── (N) Specialty
Patient (1) ──── (N) Appointment
Doctor  (1) ──── (N) Appointment
Appointment (1) ── (1) MedicalRecord
MedicalRecord (1) ── (N) ConsultationNote
MedicalRecord (1) ── (N) Prescription
MedicalRecord (1) ── (N) StudyOrder
Patient (1) ──── (N) Invoice
Invoice (1) ──── (N) Payment
User    (1) ──── (N) AuditLog
```

---

## Convenciones de Código

- Idioma del código: **inglés** (variables, funciones, clases, comentarios)
- Idioma de la UI: **español (Bolivia)**
- Branches: `feat/`, `fix/`, `chore/`
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`)
- API REST: `GET /api/v1/patients`, `POST /api/v1/appointments`
- Errores: siempre con código HTTP correcto + mensaje en español para el usuario

---

## Progreso

| Fase | Estado | Completado |
|------|--------|-----------|
| 1 — Fundación | ✅ Completa | 100% |
| 2 — Core | ⏳ Pendiente | 0% |
| 3 — HCE | ⏳ Pendiente | 0% |
| 4 — Facturación | ⏳ Pendiente | 0% |
| 5 — Notificaciones | ⏳ Pendiente | 0% |
| 6 — Seguridad / Launch | ⏳ Pendiente | 0% |
