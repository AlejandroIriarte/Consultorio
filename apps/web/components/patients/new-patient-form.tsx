'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { CreatePatientSchema } from '@consultorio/validators';

export function NewPatientForm({ accessToken }: { accessToken: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError('');

    const fd = new FormData(e.currentTarget);
    const raw = {
      firstName: fd.get('firstName') as string,
      lastName: fd.get('lastName') as string,
      dni: fd.get('dni') as string || undefined,
      phone: fd.get('phone') as string || undefined,
      email: fd.get('email') as string || undefined,
      address: fd.get('address') as string || undefined,
      dateOfBirth: fd.get('dateOfBirth') ? new Date(fd.get('dateOfBirth') as string) : undefined,
      gender: fd.get('gender') as string || undefined,
      bloodType: fd.get('bloodType') as string || undefined,
      notes: fd.get('notes') as string || undefined,
    };

    const ecName = fd.get('ecName') as string;
    const ecPhone = fd.get('ecPhone') as string;
    const ecRelation = fd.get('ecRelation') as string;

    const data = {
      ...raw,
      ...(ecName && ecPhone && ecRelation
        ? { emergencyContact: { name: ecName, phone: ecPhone, relation: ecRelation } }
        : {}),
    };

    const parsed = CreatePatientSchema.safeParse(data);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[issue.path[0] as string] = issue.message;
      setFieldErrors(errors);
      return;
    }

    setPending(true);
    try {
      const patient = await api.post<{ id: string }>('/patients', parsed.data, { accessToken });
      router.push(`/dashboard/recepcion/pacientes/${patient.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const flat: Record<string, string> = {};
        for (const [k, msgs] of Object.entries(err.errors)) flat[k] = msgs[0];
        setFieldErrors(flat);
      } else {
        setGlobalError(err instanceof ApiError ? err.message : 'Error al crear paciente');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Datos personales">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre *" name="firstName" error={fieldErrors.firstName} />
          <Field label="Apellido *" name="lastName" error={fieldErrors.lastName} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="DNI / CI" name="dni" error={fieldErrors.dni} />
          <Field label="Fecha de nacimiento" name="dateOfBirth" type="date" error={fieldErrors.dateOfBirth} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Género" name="gender" error={fieldErrors.gender} options={[
            { value: 'MALE', label: 'Masculino' },
            { value: 'FEMALE', label: 'Femenino' },
            { value: 'OTHER', label: 'Otro' },
            { value: 'PREFER_NOT_TO_SAY', label: 'Prefiero no decir' },
          ]} />
          <SelectField label="Grupo sanguíneo" name="bloodType" error={fieldErrors.bloodType} options={[
            { value: 'A_POSITIVE', label: 'A+' }, { value: 'A_NEGATIVE', label: 'A-' },
            { value: 'B_POSITIVE', label: 'B+' }, { value: 'B_NEGATIVE', label: 'B-' },
            { value: 'AB_POSITIVE', label: 'AB+' }, { value: 'AB_NEGATIVE', label: 'AB-' },
            { value: 'O_POSITIVE', label: 'O+' }, { value: 'O_NEGATIVE', label: 'O-' },
          ]} />
        </div>
      </Section>

      <Section title="Contacto">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Teléfono" name="phone" type="tel" error={fieldErrors.phone} />
          <Field label="Email" name="email" type="email" error={fieldErrors.email} />
        </div>
        <Field label="Dirección" name="address" error={fieldErrors.address} />
      </Section>

      <Section title="Contacto de emergencia">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Nombre" name="ecName" />
          <Field label="Teléfono" name="ecPhone" type="tel" />
          <Field label="Relación" name="ecRelation" placeholder="Madre, Padre, Cónyuge..." />
        </div>
      </Section>

      <Section title="Notas clínicas">
        <div>
          <label className="mb-1 block text-sm font-medium">Notas (opcional)</label>
          <textarea
            name="notes"
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Observaciones generales..."
          />
        </div>
      </Section>

      {globalError && <p className="text-sm text-destructive">{globalError}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? 'Guardando...' : 'Guardar paciente'}
        </button>
        <a
          href="/dashboard/recepcion/pacientes"
          className="rounded-md border px-6 py-2 text-sm font-medium hover:bg-accent"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-lg border p-4">
      <legend className="px-2 text-sm font-semibold text-muted-foreground">{title}</legend>
      <div className="space-y-3 pt-2">{children}</div>
    </fieldset>
  );
}

function Field({ label, name, type = 'text', error, placeholder, autoComplete }: {
  label: string; name: string; type?: string; error?: string; placeholder?: string; autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">{label}</label>
      <input
        id={name} name={name} type={type} placeholder={placeholder} autoComplete={autoComplete}
        className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${error ? 'border-destructive' : ''}`}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SelectField({ label, name, options, error }: {
  label: string; name: string; options: { value: string; label: string }[]; error?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">{label}</label>
      <select
        id={name} name={name}
        className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${error ? 'border-destructive' : ''}`}
      >
        <option value="">Seleccionar...</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
