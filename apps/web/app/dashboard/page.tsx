import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const role = session.user.role;
  if (role === 'PATIENT') redirect('/dashboard/paciente');
  if (role === 'DOCTOR') redirect('/dashboard/medico');
  if (role === 'RECEPTIONIST') redirect('/dashboard/recepcion');

  return <AdminDashboard accessToken={session.accessToken} />;
}
