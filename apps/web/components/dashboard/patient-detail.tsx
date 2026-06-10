'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { AppointmentStatusBadge } from '@/components/appointments/status-badge';
import Link from 'next/link';

interface Allergy {
  id: string;
  allergen: string;
  severity: string;
  reaction: string | null;
}

interface Medication {
  id: string;
  name: string;
  dose: string | null;
  frequency: string | null;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dni: string | null;
  birthDate: string | null;
  gender: string | null;
  bloodType: string | null;
  address: string | null;
  isActive: boolean;
  allergies: Allergy[];
  medications: Medication[];
}

interface Appointment {
  id: string;
  startAt: string;
  status: string;
  doctor: { user: { firstName: string; lastName: string } };
  specialty: { name: string } | null;
}

export function PatientDetail({ patientId, accessToken }: { patientId: string; accessToken: string }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Patient>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = useCallback(async () => {
    try {
      const [p, appts] = await Promise.all([
        api.get<Patient>(`/patients/${patientId}`, { accessToken }),
        api.get<Appointment[]>(`/appointments/patient/${patientId}`, { accessToken }),
      ]);
      setPatient(p);
      setForm({ firstName: p.firstName, lastName: p.lastName, email: p.email ?? '', phone: p.phone ?? '', address: p.address ?? '' });
      setAppointments(appts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar el paciente');
    } finally {
      setLoading(false);
    }
  }, [patientId, accessToken]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      await api.patch(`/patients/${patientId}`, form, { accessToken });
      setEditing(false);
      load();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!patient) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/recepcion/pacientes" className="text-sm text-muted-foreground hover:text-foreground">
            ← Volver
          </Link>
          <h1 className="text-2xl font-bold">{patient.firstName} {patient.lastName}</h1>
          {!patient.isActive && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Archivado
            </span>
          )}
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          {editing ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="space-y-4 rounded-lg border p-5">
          <h2 className="font-semibold">Editar datos</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre" value={form.firstName ?? ''} onChange={(v) => setForm((f) => ({ ...f, firstName: v }))} />
            <Field label="Apellido" value={form.lastName ?? ''} onChange={(v) => setForm((f) => ({ ...f, lastName: v }))} />
            <Field label="Email" value={form.email ?? ''} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
            <Field label="Teléfono" value={form.phone ?? ''} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
            <Field label="Dirección" value={form.address ?? ''} onChange={(v) => setForm((f) => ({ ...f, address: v }))} className="col-span-2" />
          </div>
          {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-2 gap-4 rounded-lg border p-5 sm:grid-cols-3">
          <InfoRow label="DNI" value={patient.dni} />
          <InfoRow label="Email" value={patient.email} />
          <InfoRow label="Teléfono" value={patient.phone} />
          <InfoRow label="Género" value={patient.gender} />
          <InfoRow label="Tipo de sangre" value={patient.bloodType} />
          <InfoRow label="Dirección" value={patient.address} />
          {patient.birthDate && (
            <InfoRow label="Fecha de nacimiento" value={new Date(patient.birthDate).toLocaleDateString('es-BO')} />
          )}
        </div>
      )}

      {patient.allergies.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Alergias</h2>
          <div className="space-y-1">
            {patient.allergies.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-md border bg-card p-3 text-sm">
                <span className="font-medium">{a.allergen}</span>
                <span className="text-muted-foreground">· Severidad: {a.severity}</span>
                {a.reaction && <span className="text-muted-foreground">· {a.reaction}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {patient.medications.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Medicación activa</h2>
          <div className="space-y-1">
            {patient.medications.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-md border bg-card p-3 text-sm">
                <span className="font-medium">{m.name}</span>
                {m.dose && <span className="text-muted-foreground">{m.dose}</span>}
                {m.frequency && <span className="text-muted-foreground">· {m.frequency}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {appointments.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Historial de turnos</h2>
          <div className="space-y-1">
            {appointments.slice(0, 10).map((a) => {
              const date = new Date(a.startAt).toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' });
              const time = new Date(a.startAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-md border bg-card p-3 text-sm">
                  <span className="w-28 text-muted-foreground">{date} {time}</span>
                  <span className="flex-1">Dr. {a.doctor.user.firstName} {a.doctor.user.lastName}</span>
                  {a.specialty && <span className="text-muted-foreground">{a.specialty.name}</span>}
                  <AppointmentStatusBadge status={a.status} />
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? '—'}</p>
    </div>
  );
}
