import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';

const ROLE_LABELS: Record<string, string> = {
  PATIENT: 'Paciente',
  DOCTOR: 'Médico',
  RECEPTIONIST: 'Recepción',
  ADMIN: 'Admin',
  OWNER: 'Owner',
};

const ROLE_COLORS: Record<string, string> = {
  PATIENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  DOCTOR: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  RECEPTIONIST: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  ADMIN: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  OWNER: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const role = session.user.role ?? 'PATIENT';
  const name = session.user.name ?? '';
  const roleLabel = ROLE_LABELS[role] ?? role;
  const roleColor = ROLE_COLORS[role] ?? 'bg-muted text-muted-foreground';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight">Consultorio</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {name && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium hidden sm:block">{name}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleColor}`}>
                {roleLabel}
              </span>
            </div>
          )}
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden md:flex w-56 flex-shrink-0 flex-col border-r bg-card/50">
          <div className="flex-1 overflow-y-auto p-3 pt-4">
            <SidebarNav role={role} />
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
