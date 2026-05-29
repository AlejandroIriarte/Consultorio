import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = { title: 'Iniciar sesión' };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Consultorio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresá con tu cuenta
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
