'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { AppointmentStatusBadge } from '@/components/appointments/status-badge';

interface Appointment {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  patient: { id: string; firstName: string; lastName: string; phone: string | null };
  doctor: { user: { firstName: string; lastName: string } };
  specialty: { name: string; color: string } | null;
}

const STATUS_ACTIONS: Record<string, { label: string; next: string }[]> = {
  PENDING:         [{ label: 'Confirmar', next: 'CONFIRMED' }, { label: 'Cancelar', next: 'CANCELLED' }],
  CONFIRMED:       [{ label: 'Llegó', next: 'WAITING_ROOM' }, { label: 'No se presentó', next: 'NO_SHOW' }],
  WAITING_ROOM:    [],
  IN_CONSULTATION: [],
  COMPLETED:       [],
  CANCELLED:       [],
  NO_SHOW:         [],
};

export function ReceptionDashboard({ accessToken }: { accessToken: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get<Appointment[]>('/appointments/today/reception', { accessToken });
      setAppointments(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar turnos');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(id: string, status: string) {
    setUpdating(id);
    try {
      await api.patch(`/appointments/${id}/status`, { status }, { accessToken });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Error al actualizar estado');
    } finally {
      setUpdating(null);
    }
  }

  const today = new Date().toLocaleDateString('es-BO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  const byStatus = {
    waiting: appointments.filter((a) => a.status === 'WAITING_ROOM'),
    upcoming: appointments.filter((a) => ['PENDING', 'CONFIRMED'].includes(a.status)),
    inProgress: appointments.filter((a) => a.status === 'IN_CONSULTATION'),
    done: appointments.filter((a) => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status)),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recepción</h1>
          <p className="text-sm capitalize text-muted-foreground">{today}</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/dashboard/recepcion/pacientes"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Pacientes
          </a>
          <a
            href="/dashboard/recepcion/turnos"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + Nuevo turno
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total hoy', value: appointments.length, color: 'text-foreground' },
          { label: 'En sala', value: byStatus.waiting.length, color: 'text-yellow-600' },
          { label: 'En consulta', value: byStatus.inProgress.length, color: 'text-blue-600' },
          { label: 'Finalizados', value: byStatus.done.filter((a) => a.status === 'COMPLETED').length, color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Sala de espera */}
      {byStatus.waiting.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-yellow-700 dark:text-yellow-400">
            Sala de espera ({byStatus.waiting.length})
          </h2>
          <div className="space-y-2">
            {byStatus.waiting.map((a) => (
              <AppointmentRow key={a.id} appt={a} actions={[]} updating={updating} onAction={changeStatus} highlight />
            ))}
          </div>
        </section>
      )}

      {/* Próximos */}
      <section>
        <h2 className="mb-3 font-semibold">Pendientes y confirmados ({byStatus.upcoming.length})</h2>
        {byStatus.upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay turnos pendientes.</p>
        ) : (
          <div className="space-y-2">
            {byStatus.upcoming.map((a) => (
              <AppointmentRow
                key={a.id}
                appt={a}
                actions={STATUS_ACTIONS[a.status] ?? []}
                updating={updating}
                onAction={changeStatus}
              />
            ))}
          </div>
        )}
      </section>

      {/* Finalizados */}
      {byStatus.done.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-muted-foreground">Finalizados ({byStatus.done.length})</h2>
          <div className="space-y-2 opacity-60">
            {byStatus.done.map((a) => (
              <AppointmentRow key={a.id} appt={a} actions={[]} updating={null} onAction={() => {}} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AppointmentRow({
  appt, actions, updating, onAction, highlight = false,
}: {
  appt: Appointment;
  actions: { label: string; next: string }[];
  updating: string | null;
  onAction: (id: string, status: string) => void;
  highlight?: boolean;
}) {
  const time = new Date(appt.startAt).toLocaleTimeString('es-BO', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${highlight ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950' : 'bg-card'}`}>
      <div className="w-14 text-center">
        <span className="text-sm font-semibold">{time}</span>
      </div>
      {appt.specialty && (
        <div
          className="h-3 w-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: appt.specialty.color }}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {appt.patient.firstName} {appt.patient.lastName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          Dr. {appt.doctor.user.lastName}
          {appt.specialty ? ` · ${appt.specialty.name}` : ''}
          {appt.patient.phone ? ` · ${appt.patient.phone}` : ''}
        </p>
      </div>
      <AppointmentStatusBadge status={appt.status} />
      {actions.length > 0 && (
        <div className="flex gap-1">
          {actions.map((action) => (
            <button
              key={action.next}
              onClick={() => onAction(appt.id, action.next)}
              disabled={updating === appt.id}
              className="rounded px-2 py-1 text-xs font-medium bg-secondary hover:bg-secondary/80 disabled:opacity-50"
            >
              {updating === appt.id ? '...' : action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />;
}

function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
      <p className="text-sm text-destructive">{message}</p>
      <button onClick={onRetry} className="mt-2 text-xs underline">Reintentar</button>
    </div>
  );
}
