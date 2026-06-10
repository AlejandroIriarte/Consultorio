import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { BookAppointmentForm } from '@/components/dashboard/book-appointment-form';
import Link from 'next/link';

export default async function NuevoTurnoPacientePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/paciente" className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold">Reservar turno</h1>
      </div>
      <BookAppointmentForm
        accessToken={session.accessToken}
        patientId={session.user.patientId}
      />
    </div>
  );
}
