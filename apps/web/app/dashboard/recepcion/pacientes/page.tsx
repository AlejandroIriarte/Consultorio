import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { PatientsList } from '@/components/patients/patients-list';

export default async function PacientesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');
  return <PatientsList accessToken={session.accessToken} />;
}
