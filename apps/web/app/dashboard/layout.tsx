import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <span className="font-semibold">Consultorio</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-sm text-muted-foreground">
            {/* session.user.name populated by NextAuth */}
          </span>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
