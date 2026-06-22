import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { TurnosView } from '@/components/dashboard/turnos-view';

export default async function TurnosRecepcionPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');
  return <TurnosView accessToken={session.accessToken} />;
}
