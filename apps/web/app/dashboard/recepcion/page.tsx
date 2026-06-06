import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { ReceptionDashboard } from '@/components/dashboard/reception-dashboard';

export default async function RecepcionPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  return <ReceptionDashboard accessToken={session.accessToken} />;
}
