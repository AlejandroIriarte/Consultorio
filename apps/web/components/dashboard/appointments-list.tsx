'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { AppointmentStatusBadge } from '@/components/appointments/status-badge';
import { BookAppointmentForm } from './book-appointment-form';

interface Appointment {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  notes: string | null;
  patient: { id: string; firstName: string; lastName: string; phone: string | null };
  doctor: { id: string; user: { firstName: string; lastName: string } };
  specialty: { name: string; color: string } | null;
}

interface Doctor {
  id: string;
  user: { firstName: string; lastName: string };
}

export function AppointmentsList({ accessToken, hideTitle }: { accessToken: string; hideTitle?: boolean }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBooking, setShowBooking] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(today);
  const [filterDoctorId, setFilterDoctorId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set('date', filterDate);
      if (filterDoctorId) params.set('doctorId', filterDoctorId);
      const data = await api.get<Appointment[]>(`/appointments?${params}`, { accessToken });
      setAppointments(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar turnos');
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterDoctorId, accessToken]);

  useEffect(() => {
    api.get<Doctor[]>('/doctors', { accessToken }).then(setDoctors).catch(() => {});
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status }, { accessToken });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al actualizar estado');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        {!hideTitle && <h1 className="text-2xl font-bold">Todos los turnos</h1>}
        <button
          onClick={() => setShowBooking((v) => !v)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showBooking ? 'Cancelar' : '+ Nuevo turno'}
        </button>
      </div>

      {showBooking && (
        <div className="rounded-lg border p-5 bg-muted/20">
          <h2 className="mb-4 font-semibold">Crear turno</h2>
          <BookAppointmentForm accessToken={accessToken} />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Fecha</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Médico</label>
          <select
            value={filterDoctorId}
            onChange={(e) => setFilterDoctorId(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.user.firstName} {d.user.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground">No hay turnos para los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {appointments.map((a) => (
            <AppointmentRow key={a.id} appt={a} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_ACTIONS: Record<string, { label: string; next: string }[]> = {
  PENDING: [
    { label: 'Confirmar', next: 'CONFIRMED' },
    { label: 'Cancelar', next: 'CANCELLED' },
  ],
  CONFIRMED: [
    { label: 'Llegó', next: 'WAITING_ROOM' },
    { label: 'No se presentó', next: 'NO_SHOW' },
    { label: 'Cancelar', next: 'CANCELLED' },
  ],
  WAITING_ROOM: [
    { label: 'Iniciar consulta', next: 'IN_CONSULTATION' },
    { label: 'Cancelar', next: 'CANCELLED' },
  ],
  IN_CONSULTATION: [
    { label: 'Finalizar', next: 'COMPLETED' },
  ],
};

function AppointmentRow({
  appt,
  onStatusChange,
}: {
  appt: Appointment;
  onStatusChange: (id: string, status: string) => void;
}) {
  const time = new Date(appt.startAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
  const date = new Date(appt.startAt).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' });
  const actions = STATUS_ACTIONS[appt.status] ?? [];

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
      <div className="w-20 text-sm font-semibold text-center">
        <span className="block">{time}</span>
        <span className="block text-xs font-normal text-muted-foreground">{date}</span>
      </div>
      {appt.specialty && (
        <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: appt.specialty.color }} />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium">{appt.patient.firstName} {appt.patient.lastName}</p>
        <p className="text-xs text-muted-foreground">
          Dr. {appt.doctor.user.firstName} {appt.doctor.user.lastName}
          {appt.specialty ? ` · ${appt.specialty.name}` : ''}
        </p>
      </div>
      <AppointmentStatusBadge status={appt.status} />
      {actions.length > 0 && (
        <div className="flex gap-1">
          {actions.map((action) => (
            <button
              key={action.next}
              onClick={() => onStatusChange(appt.id, action.next)}
              className="rounded px-2 py-1 text-xs font-medium bg-muted hover:bg-muted/80 transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
