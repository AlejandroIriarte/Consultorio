'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LoginSchema } from '@consultorio/validators';

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  async function handleCredentials(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const data = { email: fd.get('email') as string, password: fd.get('password') as string };

    const parsed = LoginSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setCredentials(data);

    setPending(true);
    const result = await signIn('credentials', { ...data, redirect: false });
    setPending(false);

    if (result?.error === 'Se requiere el código de autenticación 2FA') {
      setStep('2fa');
    } else if (result?.error) {
      setError('Email o contraseña incorrectos');
    } else {
      router.push('/dashboard');
    }
  }

  async function handle2FA(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const totpCode = fd.get('totpCode') as string;

    setPending(true);
    const result = await signIn('credentials', {
      ...credentials,
      totpCode,
      redirect: false,
    });
    setPending(false);

    if (result?.error) {
      setError('Código inválido');
    } else {
      router.push('/dashboard');
    }
  }

  if (step === '2fa') {
    return (
      <form onSubmit={handle2FA} className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold">Verificación en dos pasos</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Ingresá el código de tu app autenticadora
        </p>
        <input
          name="totpCode"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          autoFocus
          required
          className="mb-4 w-full rounded-md border px-3 py-2 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? 'Verificando...' : 'Verificar'}
        </button>
        <button
          type="button"
          onClick={() => setStep('credentials')}
          className="mt-2 w-full text-center text-sm text-muted-foreground hover:underline"
        >
          Volver
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleCredentials} className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-4">
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <a href="/auth/forgot-password" className="text-xs text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? 'Ingresando...' : 'Ingresar'}
      </button>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        ¿No tenés cuenta?{' '}
        <a href="/auth/register" className="text-primary hover:underline">
          Registrarse
        </a>
      </p>
    </form>
  );
}
