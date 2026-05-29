import type { Metadata } from 'next';
import { VerifyEmailContent } from './verify-email-content';

export const metadata: Metadata = { title: 'Verificar email' };

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <VerifyEmailContent token={searchParams.token} />
      </div>
    </div>
  );
}
