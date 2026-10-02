//web/app/admin/(dashboard)/layout.tsx
import { SessionProvider } from '@/components/admin/SessionProvider';
import { NotificationsProvider } from '@/components/admin/NotificationsProvider';
import { Sidebar } from '@/components/admin/Sidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { BottomNav } from '@/components/admin/BottomNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NotificationsProvider>
        <div className="min-h-screen bg-ocean-50/50 lg:flex">
          <Sidebar />
          <div className="min-w-0 flex-1">
            <AdminTopBar />
            {/* pb-28 : laisse la place à la barre de navigation du bas sur mobile */}
            <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-8 sm:pt-6 lg:pb-10 lg:pt-4">
              {children}
            </main>
          </div>
        </div>
        <BottomNav />
      </NotificationsProvider>
    </SessionProvider>
  );
}