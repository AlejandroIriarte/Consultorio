'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { AppointmentStatusBadge } from '@/components/appointments/status-badge';

interface Appointment {
  id: string;
  startAt: string;
  status: string;
  doctor: { user: { firstName: string; lastName: string } };
  specialty: { name: string; color: string } | null;
}

export function PatientPortal({ accessToken }: { accessToken: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      // Backend resolves patientId from JWT sub
      const data = await api.get<Appointment[]>('/appointments?patientId=me', { accessToken });
      setAppointments(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar turnos');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const upcoming = appointments.filter(
    (a) => ['PENDING', 'CONFIRMED', 'WAITING_ROOM', 'IN_CONSULTATION'].includes(a.status)
  );
  const past = appointments.filter(
    (a) => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status)
  ).slice(0, 10);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis turnos</h1>
        <a
          href="/dashboard/paciente/turnos/nuevo"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Reservar turno
        </a>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <section>
        <h2 className="mb-3 font-semibold">Próximos</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">No tenés turnos programados.</p>
            <a href="/dashboard/paciente/turnos/nuevo" className="mt-2 inline-block text-sm text-primary hover:underline">
              Reservar un turno
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((a) => <AppointmentCard key={a.id} appt={a} />)}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-muted-foreground">Historial</h2>
          <div className="space-y-2 opacity-70">
            {past.map((a) => <AppointmentCard key={a.id} appt={a} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function AppointmentCard({ appt }: { appt: Appointment }) {
  const date = new Date(appt.startAt).toLocaleDateString('es-BO', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
  const time = new Date(appt.startAt).toLocaleTimeString('es-BO', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
      {appt.specialty && (
        <div className="h-10 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: appt.specialty.color }} />
      )}
      <div className="flex-1">
        <p className="font-medium">Dr. {appt.doctor.user.firstName} {appt.doctor.user.lastName}</p>
        <p className="text-sm text-muted-foreground">
          {appt.specialty?.name} · {date} {time}
        </p>
      </div>
      <AppointmentStatusBadge status={appt.status} />
    </div>
  );
}
