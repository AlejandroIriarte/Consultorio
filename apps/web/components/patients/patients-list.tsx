'use client';

import { useState, useCallback, useEffect } from 'react';
import { api, ApiError } from '@/lib/api-client';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dni: string | null;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  gender: string | null;
}

interface PaginatedPatients {
  data: Patient[];
  total: number;
  page: number;
  totalPages: number;
}

export function PatientsList({ accessToken }: { accessToken: string }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [result, setResult] = useState<PaginatedPatients | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const search = useCallback(async (q: string, page = 1) => {
    if (!q.trim()) { setResult(null); return; }
    setLoading(true);
    setError('');
    try {
      const data = await api.get<PaginatedPatients>(
        `/patients?q=${encodeURIComponent(q)}&page=${page}&limit=20`,
        { accessToken },
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al buscar');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { if (debouncedQuery) search(debouncedQuery); }, [debouncedQuery, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <a
          href="/dashboard/recepcion/pacientes/nuevo"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Nuevo paciente
        </a>
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, DNI, teléfono o email..."
          className="w-full rounded-md border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          autoFocus
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!query && (
        <p className="text-center text-sm text-muted-foreground py-12">
          Escribí al menos 1 carácter para buscar pacientes
        </p>
      )}

      {result && (
        <>
          <p className="text-xs text-muted-foreground">{result.total} resultado{result.total !== 1 ? 's' : ''}</p>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {['Paciente', 'DNI', 'Teléfono', 'Email', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.data.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.lastName}, {p.firstName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.dni ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">{p.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <a href={`/dashboard/recepcion/pacientes/${p.id}`} className="text-primary text-xs hover:underline">
                        Ver ficha →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => search(debouncedQuery, p)}
                  className={`h-8 w-8 rounded text-sm ${p === result.page ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
