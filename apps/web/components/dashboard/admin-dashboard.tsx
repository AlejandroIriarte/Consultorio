'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api-client';
import Link from 'next/link';

interface AdminStats {
  totalPatients: number;
  totalDoctors: number;
  todayTotal: number;
  todayCompleted: number;
  todayCancelled: number;
}

export function AdminDashboard({ accessToken }: { accessToken: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.get<AdminStats>('/appointments/stats/today', { accessToken });
      setStats(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toLocaleDateString('es-BO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resumen del sistema</h1>
        <p className="text-sm capitalize text-muted-foreground">{today}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Pacientes registrados" value={stats.totalPatients} color="text-blue-600" />
            <StatCard label="Médicos activos" value={stats.totalDoctors} color="text-purple-600" />
            <StatCard label="Turnos hoy" value={stats.todayTotal} />
            <StatCard label="Finalizados hoy" value={stats.todayCompleted} color="text-green-600" />
            <StatCard label="Cancelados hoy" value={stats.todayCancelled} color="text-red-600" />
          </div>

          <div>
            <h2 className="mb-3 font-semibold">Accesos rápidos</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <QuickLink
                href="/dashboard/recepcion"
                title="Sala de espera"
                description="Ver turnos del día y sala de espera en vivo"
              />
              <QuickLink
                href="/dashboard/recepcion/turnos"
                title="Todos los turnos"
                description="Ver y filtrar turnos por fecha y médico"
              />
              <QuickLink
                href="/dashboard/recepcion/pacientes"
                title="Pacientes"
                description="Buscar y gestionar fichas de pacientes"
              />
            </div>
          </div>
        </>
      )}
    </div>
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

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border bg-card p-4 hover:bg-muted/30 transition-colors block"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
