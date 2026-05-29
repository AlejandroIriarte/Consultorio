'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';

type Step = 'loading' | 'qr' | 'verify' | 'done';

export function TwoFactorSetup() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>('loading');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;
    api
      .get<{ qrCode: string; secret: string }>('/auth/2fa/setup', {
        accessToken: session.accessToken,
      })
      .then((data) => {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setStep('qr');
      })
      .catch(() => setError('No se pudo iniciar la configuración'));
  }, [session]);

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      await api.post('/auth/2fa/confirm', { totpCode: code }, { accessToken: session?.accessToken });
      setStep('done');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Código inválido');
    } finally {
      setPending(false);
    }
  }

  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">2FA activado</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu cuenta ahora tiene protección de dos factores.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Ir al dashboard
        </button>
      </div>
    );
  }

  if (step === 'qr') {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <p className="text-sm text-muted-foreground">
          Escaneá este código QR con tu app autenticadora (Google Authenticator, Authy, etc.)
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrCode} alt="Código QR para 2FA" className="mx-auto rounded-md border p-2" />
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">¿No podés escanear el QR? Ver clave manual</summary>
          <code className="mt-2 block break-all rounded bg-muted px-2 py-1">{secret}</code>
        </details>
        <button
          onClick={() => setStep('verify')}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Ya lo agregué — continuar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleConfirm} className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
      <p className="text-sm text-muted-foreground">
        Ingresá el código de 6 dígitos que muestra tu app autenticadora para confirmar.
      </p>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        placeholder="000000"
        autoFocus
        required
        className="w-full rounded-md border px-3 py-2 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        type="submit"
        disabled={pending || code.length < 6}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? 'Verificando...' : 'Confirmar y activar 2FA'}
      </button>
      <button
        type="button"
        onClick={() => setStep('qr')}
        className="w-full text-center text-sm text-muted-foreground hover:underline"
      >
        Volver al QR
      </button>
    </form>
  );
}
