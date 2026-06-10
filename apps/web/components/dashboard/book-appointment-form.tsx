'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';

interface Specialty {
  id: string;
  name: string;
  color: string;
}

interface Doctor {
  id: string;
  user: { firstName: string; lastName: string };
  specialties: { specialty: Specialty; isPrimary: boolean }[];
}

interface Slot {
  start: string;
  end: string;
}

interface PatientResult {
  id: string;
  firstName: string;
  lastName: string;
  dni: string | null;
}

export function BookAppointmentForm({
  accessToken,
  patientId: fixedPatientId,
}: {
  accessToken: string;
  patientId?: string | null;
}) {
  const router = useRouter();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  // Patient search (only used when no fixedPatientId)
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<PatientResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [searchingPatient, setSearchingPatient] = useState(false);

  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get<Specialty[]>('/doctors/specialties', { accessToken }).then(setSpecialties).catch(() => {});
    api.get<Doctor[]>('/doctors', { accessToken }).then(setDoctors).catch(() => {});
  }, [accessToken]);

  // Debounced patient search
  useEffect(() => {
    if (fixedPatientId || patientQuery.trim().length < 2) {
      setPatientResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearchingPatient(true);
      try {
        const res = await api.get<{ data: PatientResult[] }>(
          `/patients?q=${encodeURIComponent(patientQuery)}&limit=8`,
          { accessToken },
        );
        setPatientResults(res.data);
      } catch {
        setPatientResults([]);
      } finally {
        setSearchingPatient(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [patientQuery, accessToken, fixedPatientId]);

  const filteredDoctors = selectedSpecialtyId
    ? doctors.filter((d) => d.specialties.some((s) => s.specialty.id === selectedSpecialtyId))
    : doctors;

  const loadSlots = useCallback(async () => {
    if (!selectedDoctorId || !selectedDate) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot('');
    try {
      const data = await api.get<Slot[]>(
        `/doctors/slots?doctorId=${selectedDoctorId}&date=${selectedDate}`,
        { accessToken },
      );
      setSlots(data);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDoctorId, selectedDate, accessToken]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const resolvedPatientId = fixedPatientId ?? selectedPatient?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !resolvedPatientId) return;
    const slot = slots.find((s) => s.start === selectedSlot);
    if (!slot) return;

    setSubmitting(true);
    setError('');
    try {
      await api.post(
        '/appointments',
        {
          patientId: resolvedPatientId,
          doctorId: selectedDoctorId,
          specialtyId: selectedSpecialtyId || undefined,
          startAt: slot.start,
          endAt: slot.end,
          notes: notes || undefined,
        },
        { accessToken },
      );
      setSuccess(true);
      setTimeout(() => router.push(fixedPatientId ? '/dashboard/paciente' : '/dashboard/recepcion/turnos'), 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al reservar el turno');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border bg-green-50 dark:bg-green-950">
        <p className="text-green-700 dark:text-green-300 font-medium">Turno reservado. Redirigiendo...</p>
      </div>
    );
  }

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {/* Patient search — only shown for reception */}
      {!fixedPatientId && (
        <div className="space-y-1 relative">
          <label className="text-sm font-medium">
            Paciente <span className="text-destructive">*</span>
          </label>
          {selectedPatient ? (
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <span className="flex-1 font-medium">
                {selectedPatient.lastName}, {selectedPatient.firstName}
                {selectedPatient.dni ? ` · DNI ${selectedPatient.dni}` : ''}
              </span>
              <button
                type="button"
                onClick={() => { setSelectedPatient(null); setPatientQuery(''); }}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={patientQuery}
                onChange={(e) => setPatientQuery(e.target.value)}
                placeholder="Buscar por nombre, DNI o teléfono..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              {searchingPatient && (
                <p className="text-xs text-muted-foreground">Buscando...</p>
              )}
              {patientResults.length > 0 && (
                <div className="absolute z-10 w-full rounded-md border bg-card shadow-lg mt-0.5">
                  {patientResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setSelectedPatient(p); setPatientResults([]); setPatientQuery(''); }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
                    >
                      {p.lastName}, {p.firstName}
                      {p.dni ? <span className="text-muted-foreground"> · {p.dni}</span> : ''}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium">Especialidad</label>
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={selectedSpecialtyId}
          onChange={(e) => { setSelectedSpecialtyId(e.target.value); setSelectedDoctorId(''); }}
        >
          <option value="">Todas las especialidades</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">
          Médico <span className="text-destructive">*</span>
        </label>
        <select
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={selectedDoctorId}
          onChange={(e) => setSelectedDoctorId(e.target.value)}
        >
          <option value="">Seleccioná un médico</option>
          {filteredDoctors.map((d) => (
            <option key={d.id} value={d.id}>
              Dr. {d.user.firstName} {d.user.lastName}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">
          Fecha <span className="text-destructive">*</span>
        </label>
        <input
          required
          type="date"
          min={minDate}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {selectedDoctorId && selectedDate && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Horario <span className="text-destructive">*</span>
          </label>
          {loadingSlots ? (
            <p className="text-sm text-muted-foreground">Cargando horarios disponibles...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay turnos disponibles para esa fecha.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((slot) => {
                const time = new Date(slot.start).toLocaleTimeString('es-BO', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <button
                    key={slot.start}
                    type="button"
                    onClick={() => setSelectedSlot(slot.start)}
                    className={`rounded-md border py-1.5 text-sm font-medium transition-colors ${
                      selectedSlot === slot.start
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium">Notas (opcional)</label>
        <textarea
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
          placeholder="Motivo de consulta, observaciones..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !selectedSlot || !resolvedPatientId}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Reservando...' : 'Confirmar turno'}
      </button>
    </form>
  );
}
