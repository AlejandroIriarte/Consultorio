import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DoctorDashboard } from '@/components/dashboard/doctor-dashboard';

export default async function MedicoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');
  return <DoctorDashboard accessToken={session.accessToken} />;
}
