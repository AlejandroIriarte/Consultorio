import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

export default async function HcePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-96 gap-6 text-center">
      <div className="rounded-full bg-purple-100 dark:bg-purple-950 p-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-purple-600 dark:text-purple-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Historia Clínica Electrónica</h1>
        <p className="text-muted-foreground max-w-sm">
          El módulo de HCE está en desarrollo. Estará disponible en la próxima versión del sistema
          con notas SOAP, diagnósticos CIE-10, recetas digitales y más.
        </p>
        <p className="text-xs text-muted-foreground">ID de paciente: {params.id}</p>
      </div>
      <Link
        href="/dashboard/medico"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        ← Volver a mi agenda
      </Link>
    </div>
  );
}
