import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AppointmentsList } from '@/components/dashboard/appointments-list';

export default async function TurnosRecepcionPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');
  return <AppointmentsList accessToken={session.accessToken} />;
}
