//web/components/admin/BottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, KeyRound, LayoutDashboard, Users } from 'lucide-react';
import clsx from 'clsx';
import { useAdminData } from './NotificationsProvider';

const items = [
  { href: '/admin', label: 'Accueil', icon: LayoutDashboard },
  { href: '/admin/demandes', label: 'Demandes', icon: Inbox },
  { href: '/admin/membres', label: 'Membres', icon: Users },
  { href: '/admin/codes', label: 'Codes', icon: KeyRound },
];

/** Barre de navigation flottante en bas de l'écran (mobile uniquement). */
export function BottomNav() {
  const pathname = usePathname();
  const { requestsToHandle } = useAdminData();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between rounded-3xl bg-white/90 p-1.5 shadow-[0_10px_35px_rgba(10,60,90,0.22)] ring-1 ring-ocean-100 backdrop-blur-xl">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
          const badge = href === '/admin/demandes' ? requestsToHandle : 0;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className="group flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-semibold"
            >
              <span
                className={clsx(
                  'relative flex h-9 w-14 items-center justify-center rounded-2xl transition-all duration-300',
                  active
                    ? '-translate-y-1 bg-gradient-to-br from-ocean-600 to-ocean-800 text-white shadow-lg shadow-ocean-800/30'
                    : 'text-ocean-400 group-hover:bg-ocean-50 group-hover:text-ocean-600 group-active:scale-90',
                )}
              >
                <Icon className="h-5 w-5" />
                {badge > 0 && (
                  <span
                    key={badge}
                    className="animate-pop-in absolute -right-0.5 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white"
                  >
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span
                className={clsx(
                  'transition-colors',
                  active ? 'text-ocean-800' : 'text-ocean-400',
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}