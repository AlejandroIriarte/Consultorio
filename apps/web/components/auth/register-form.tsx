'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegisterSchema } from '@consultorio/validators';
import { api, ApiError } from '@/lib/api-client';

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError('');

    const fd = new FormData(e.currentTarget);
    const data = {
      firstName: fd.get('firstName') as string,
      lastName: fd.get('lastName') as string,
      email: fd.get('email') as string,
      password: fd.get('password') as string,
    };
    const confirmPassword = fd.get('confirmPassword') as string;

    if (data.password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Las contraseñas no coinciden' });
      return;
    }

    const parsed = RegisterSchema.safeParse(data);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errors[issue.path[0] as string] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setPending(true);
    try {
      await api.post('/auth/register', data);
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) {
          const flat: Record<string, string> = {};
          for (const [k, msgs] of Object.entries(err.errors)) flat[k] = msgs[0];
          setFieldErrors(flat);
        } else {
          setGlobalError(err.message);
        }
      } else {
        setGlobalError('Ocurrió un error inesperado');
      }
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">¡Cuenta creada!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisá tu email para verificar tu cuenta.
        </p>
        <button
          onClick={() => router.push('/auth/login')}
          className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Ir al inicio de sesión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre" name="firstName" error={fieldErrors.firstName} autoComplete="given-name" />
        <Field label="Apellido" name="lastName" error={fieldErrors.lastName} autoComplete="family-name" />
      </div>
      <Field label="Email" name="email" type="email" error={fieldErrors.email} autoComplete="email" />
      <Field label="Contraseña" name="password" type="password" error={fieldErrors.password} autoComplete="new-password" />
      <Field label="Confirmar contraseña" name="confirmPassword" type="password" error={fieldErrors.confirmPassword} autoComplete="new-password" />

      {globalError && <p className="text-sm text-destructive">{globalError}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{' '}
        <a href="/auth/login" className="text-primary hover:underline">
          Iniciar sesión
        </a>
      </p>
    </form>
  );
}

function Field({
  label, name, type = 'text', error, autoComplete,
}: {
  label: string; name: string; type?: string; error?: string; autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${error ? 'border-destructive' : ''}`}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
