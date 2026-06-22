'use client';

import { useState } from 'react';
import { AppointmentsList } from './appointments-list';
import { WeeklyCalendar } from '@/components/appointments/weekly-calendar';

type ViewMode = 'lista' | 'calendario';

export function TurnosView({ accessToken }: { accessToken: string }) {
  const [mode, setMode] = useState<ViewMode>('lista');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Turnos</h1>
        <div className="flex rounded-md border overflow-hidden text-sm font-medium">
          <button
            onClick={() => setMode('lista')}
            className={`px-4 py-1.5 transition-colors ${
              mode === 'lista'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setMode('calendario')}
            className={`px-4 py-1.5 transition-colors ${
              mode === 'calendario'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            Calendario
          </button>
        </div>
      </div>

      {mode === 'lista' ? (
        <AppointmentsList accessToken={accessToken} hideTitle />
      ) : (
        <WeeklyCalendar accessToken={accessToken} />
      )}
    </div>
  );
}
