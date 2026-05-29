'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';

type Status = 'loading' | 'success' | 'error' | 'no-token';

export function VerifyEmailContent({ token }: { token?: string }) {
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'no-token');

  useEffect(() => {
    if (!token) return;
    api
      .post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch((err) => {
        console.error(err instanceof ApiError ? err.message : err);
        setStatus('error');
      });
  }, [token]);

  const configs = {
    loading: {
      icon: (
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      ),
      bg: '',
      title: 'Verificando tu email...',
      body: 'Por favor esperá un momento.',
      cta: null,
    },
    success: {
      icon: (
        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      bg: 'bg-green-100 dark:bg-green-900',
      title: '¡Email verificado!',
      body: 'Tu cuenta está lista. Ya podés iniciar sesión.',
      cta: { label: 'Iniciar sesión', href: '/auth/login' },
    },
    error: {
      icon: (
        <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      bg: 'bg-red-100 dark:bg-red-900',
      title: 'Enlace inválido o expirado',
      body: 'El enlace de verificación no es válido o ya fue usado.',
      cta: { label: 'Volver al inicio', href: '/auth/login' },
    },
    'no-token': {
      icon: (
        <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bg: 'bg-muted',
      title: 'Enlace incompleto',
      body: 'No se encontró el token de verificación en la URL.',
      cta: { label: 'Volver al inicio', href: '/auth/login' },
    },
  };

  const c = configs[status];

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
      {c.bg ? (
        <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${c.bg}`}>
          {c.icon}
        </div>
      ) : (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center">{c.icon}</div>
      )}
      <h2 className="text-lg font-semibold">{c.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
      {c.cta && (
        <a
          href={c.cta.href}
          className="mt-4 inline-block w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {c.cta.label}
        </a>
      )}
    </div>
  );
}
