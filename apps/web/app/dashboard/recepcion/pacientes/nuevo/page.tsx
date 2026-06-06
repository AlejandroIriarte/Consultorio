import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { NewPatientForm } from '@/components/patients/new-patient-form';

export default async function NuevoPacientePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <a href="/dashboard/recepcion/pacientes" className="text-sm text-muted-foreground hover:underline">
          ← Volver a pacientes
        </a>
        <h1 className="mt-2 text-2xl font-bold">Nuevo paciente</h1>
      </div>
      <NewPatientForm accessToken={session.accessToken} />
    </div>
  );
}
