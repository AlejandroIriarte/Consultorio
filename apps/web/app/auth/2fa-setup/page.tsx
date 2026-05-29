import type { Metadata } from 'next';
import { TwoFactorSetup } from '@/components/auth/two-factor-setup';

export const metadata: Metadata = { title: 'Configurar autenticación de dos factores' };

export default function TwoFactorSetupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Autenticación de dos factores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Agregá una capa extra de seguridad a tu cuenta
          </p>
        </div>
        <TwoFactorSetup />
      </div>
    </div>
  );
}
