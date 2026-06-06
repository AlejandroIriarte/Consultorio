import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { PatientPortal } from '@/components/dashboard/patient-portal';

export default async function PacientePortalPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');
  return <PatientPortal accessToken={session.accessToken} />;
}
