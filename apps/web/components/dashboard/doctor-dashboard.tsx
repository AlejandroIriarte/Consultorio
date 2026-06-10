'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { AppointmentStatusBadge } from '@/components/appointments/status-badge';

interface Appointment {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  notes: string | null;
  patient: { id: string; firstName: string; lastName: string; phone: string | null };
  specialty: { name: string; color: string } | null;
}

export function DoctorDashboard({ accessToken }: { accessToken: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Appointment | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<Appointment[]>('/appointments/my-today', { accessToken });
      setAppointments(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar agenda');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toLocaleDateString('es-BO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const inConsultation = appointments.find((a) => a.status === 'IN_CONSULTATION');
  const waiting = appointments.filter((a) => a.status === 'WAITING_ROOM');
  const upcoming = appointments.filter((a) => ['PENDING', 'CONFIRMED'].includes(a.status));

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi agenda</h1>
        <p className="text-sm capitalize text-muted-foreground">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total hoy" value={appointments.length} />
        <StatCard label="En sala de espera" value={waiting.length} color="text-yellow-600" />
        <StatCard label="Restantes" value={upcoming.length} color="text-blue-600" />
      </div>

      {/* En consulta ahora */}
      {inConsultation && (
        <div className="rounded-lg border-2 border-purple-300 bg-purple-50 p-4 dark:border-purple-700 dark:bg-purple-950">
          <p className="text-xs font-semibold uppercase text-purple-600 dark:text-purple-400">En consulta ahora</p>
          <p className="mt-1 text-lg font-bold">
            {inConsultation.patient.firstName} {inConsultation.patient.lastName}
          </p>
          <a
            href={`/dashboard/medico/paciente/${inConsultation.patient.id}/hce`}
            className="mt-2 inline-block rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
          >
            Abrir historia clínica →
          </a>
        </div>
      )}

      {/* Cola de espera */}
      {waiting.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-yellow-700 dark:text-yellow-400">
            Sala de espera ({waiting.length})
          </h2>
          <div className="space-y-2">
            {waiting.map((a) => <AppointmentCard key={a.id} appt={a} onClick={() => setSelected(a)} />)}
          </div>
        </section>
      )}

      {/* Próximos */}
      <section>
        <h2 className="mb-2 font-semibold">Próximos ({upcoming.length})</h2>
        {upcoming.length === 0
          ? <p className="text-sm text-muted-foreground">No hay más turnos programados.</p>
          : <div className="space-y-2">{upcoming.map((a) => <AppointmentCard key={a.id} appt={a} onClick={() => setSelected(a)} />)}</div>
        }
      </section>
    </div>
  );
}

function AppointmentCard({ appt, onClick }: { appt: Appointment; onClick: () => void }) {
  const time = new Date(appt.startAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-lg border bg-card p-3 text-left hover:bg-muted/30 transition-colors"
    >
      <span className="w-14 text-sm font-semibold text-center">{time}</span>
      {appt.specialty && <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: appt.specialty.color }} />}
      <div className="flex-1 min-w-0">
        <p className="font-medium">{appt.patient.firstName} {appt.patient.lastName}</p>
        <p className="text-xs text-muted-foreground">{appt.specialty?.name ?? ''}</p>
      </div>
      <AppointmentStatusBadge status={appt.status} />
    </button>
  );
}

function StatCard({ label, value, color = 'text-foreground' }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
