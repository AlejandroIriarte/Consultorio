'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { api, ApiError } from '@/lib/api-client';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { es },
});

interface Appointment {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  notes: string | null;
  patient: { id: string; firstName: string; lastName: string };
  doctor: { id: string; user: { firstName: string; lastName: string } };
  specialty: { name: string; color: string } | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  WAITING_ROOM: '#8b5cf6',
  IN_CONSULTATION: '#10b981',
  COMPLETED: '#6b7280',
  CANCELLED: '#ef4444',
  NO_SHOW: '#f97316',
};

export function WeeklyCalendar({
  accessToken,
  onSelectAppointment,
}: {
  accessToken: string;
  onSelectAppointment?: (appt: Appointment) => void;
}) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('week');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadWeek = useCallback(async (date: Date) => {
    setLoading(true);
    setError('');
    try {
      const monday = startOfWeek(date, { weekStartsOn: 1 });
      const sunday = addDays(monday, 6);
      const from = monday.toISOString();
      const to = sunday.toISOString();
      const data = await api.get<Appointment[]>(
        `/appointments?from=${from}&to=${to}`,
        { accessToken },
      );
      setEvents(
        data.map((a) => ({
          id: a.id,
          title: `${a.patient.firstName} ${a.patient.lastName}`,
          start: new Date(a.startAt),
          end: new Date(a.endAt),
          resource: a,
        })),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar turnos');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadWeek(currentDate); }, [loadWeek, currentDate]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const color = event.resource.specialty?.color ?? STATUS_COLORS[event.resource.status] ?? '#3b82f6';
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: '#fff',
        borderRadius: '4px',
        fontSize: '0.75rem',
        padding: '1px 4px',
      },
    };
  };

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
      <div style={{ height: '70vh' }}>
        <Calendar
          localizer={localizer}
          events={events}
          view={view}
          onView={setView}
          date={currentDate}
          onNavigate={setCurrentDate}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event) => onSelectAppointment?.(event.resource)}
          messages={{
            next: 'Sig.',
            previous: 'Ant.',
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            agenda: 'Agenda',
            noEventsInRange: 'Sin turnos en este período',
          }}
          culture="es"
          popup
        />
      </div>
    </div>
  );
}
