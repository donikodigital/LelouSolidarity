import { SessionProvider } from '@/components/admin/SessionProvider';
import { Sidebar } from '@/components/admin/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-ocean-50/50">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
