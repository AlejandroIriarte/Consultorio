import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { PatientDetail } from '@/components/dashboard/patient-detail';

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');
  return <PatientDetail patientId={params.id} accessToken={session.accessToken} />;
}
