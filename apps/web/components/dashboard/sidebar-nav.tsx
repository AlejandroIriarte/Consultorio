'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface NavItem {
  label: string;
  href: string;
}

const ROLE_NAV: Record<string, NavItem[]> = {
  PATIENT: [
    { label: 'Mis turnos', href: '/dashboard/paciente' },
    { label: 'Reservar turno', href: '/dashboard/paciente/turnos/nuevo' },
  ],
  DOCTOR: [
    { label: 'Mi agenda', href: '/dashboard/medico' },
  ],
  RECEPTIONIST: [
    { label: 'Hoy', href: '/dashboard/recepcion' },
    { label: 'Todos los turnos', href: '/dashboard/recepcion/turnos' },
    { label: 'Pacientes', href: '/dashboard/recepcion/pacientes' },
    { label: 'Nuevo paciente', href: '/dashboard/recepcion/pacientes/nuevo' },
  ],
  ADMIN: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Turnos de hoy', href: '/dashboard/recepcion' },
    { label: 'Todos los turnos', href: '/dashboard/recepcion/turnos' },
    { label: 'Pacientes', href: '/dashboard/recepcion/pacientes' },
  ],
  OWNER: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Turnos de hoy', href: '/dashboard/recepcion' },
    { label: 'Todos los turnos', href: '/dashboard/recepcion/turnos' },
    { label: 'Pacientes', href: '/dashboard/recepcion/pacientes' },
  ],
};

export function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname();
  const items = ROLE_NAV[role] ?? [];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto pt-4 border-t">
        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="w-full rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground text-left transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
