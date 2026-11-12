//web/components/admin/Sidebar.tsx
// v1.3 — lien « Profil » et bloc compte (photo, nom) menant à la page profil.
// v1.2 — barre latérale pour grand écran uniquement : sur mobile, la navigation
// passe par la barre du bas (BottomNav) et le profil par le logo de l'en-tête.
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, KeyRound, Inbox, LogOut, UserRound } from 'lucide-react';
import clsx from 'clsx';
import { Logo } from '@/components/layout/Logo';
import { Avatar } from './Avatar';
import { useSession } from './SessionProvider';
import { useAdminData } from './NotificationsProvider';
import { ASSOCIATION_NAME } from '@/lib/constants';
import { useI18n } from '@/lib/i18n/I18nProvider';

const links = [
  { href: '/admin', key: 'dashboard', icon: LayoutDashboard },
  { href: '/admin/demandes', key: 'requests', icon: Inbox },
  { href: '/admin/membres', key: 'members', icon: Users },
  { href: '/admin/codes', key: 'accessCodes', icon: KeyRound },
  { href: '/admin/profil', key: 'profile', icon: UserRound },
] as const;

export function Sidebar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const { session, logout } = useSession();
  const { requestsToHandle } = useAdminData();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col bg-ocean-700 py-6 lg:flex">
      <div className="mb-6 flex min-w-0 items-center gap-2.5 px-4">
        <Logo size={40} className="flex-shrink-0 ring-2 ring-[#D8B65C]/80" />
        <span className="truncate text-sm font-bold text-white">{ASSOCIATION_NAME}</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {links.map((link) => {
          const active =
            link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
          const badge = link.href === '/admin/demandes' ? requestsToHandle : 0;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-white text-ocean-700 shadow-sm'
                  : 'text-ocean-100 hover:bg-ocean-600/60 hover:text-white',
              )}
            >
              <link.icon className="h-5 w-5" />
              <span className="flex-1">{t.admin.nav[link.key]}</span>
              {badge > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pt-6">
        <div className="rounded-xl bg-ocean-600/50 p-3">
          <Link
            href="/admin/profil"
            className="flex min-w-0 items-center gap-2.5 rounded-lg p-1 transition-colors hover:bg-ocean-600"
          >
            <Avatar
              name={session.admin.name}
              email={session.admin.email}
              src={session.admin.avatarUrl}
              size={34}
            />
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold text-white">
                {session.admin.name?.trim() || t.admin.account.manager}
              </span>
              <span className="block truncate text-[11px] font-medium text-ocean-100">
                {session.admin.email}
              </span>
            </span>
          </Link>
          <button
            onClick={logout}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-ocean-100 hover:bg-ocean-600"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t.admin.nav.logout}
          </button>
        </div>
      </div>
    </aside>
  );
}