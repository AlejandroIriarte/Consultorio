import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = { title: 'Crear cuenta' };

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Consultorio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Creá tu cuenta para comenzar
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
