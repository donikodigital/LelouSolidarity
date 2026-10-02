//web/components/admin/AdminTopBar.tsx
'use client';

import { useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import clsx from 'clsx';
import { Logo } from '@/components/layout/Logo';
import { ASSOCIATION_NAME } from '@/lib/constants';
import { useAdminData } from './NotificationsProvider';
import { NotificationsSheet } from './NotificationsSheet';
import { ProfileSheet } from './ProfileSheet';

function BellButton({
  count,
  onClick,
  tone,
}: {
  count: number;
  onClick: () => void;
  tone: 'dark' | 'light';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={count > 0 ? `Notifications (${count} non lues)` : 'Notifications'}
      className={clsx(
        'relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-90',
        tone === 'dark'
          ? 'bg-white/10 text-white hover:bg-white/20'
          : 'bg-white text-ocean-600 shadow-card hover:-translate-y-0.5 hover:shadow-card-hover',
      )}
    >
      <Bell className={clsx('h-5 w-5', count > 0 && 'animate-wiggle')} />
      {count > 0 && (
        <span
          key={count}
          className="animate-pop-in absolute -right-0.5 -top-0.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-ocean-700 lg:ring-ocean-50"
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}

/**
 * Barre du haut : logo cliquable (profil) à gauche, cloche de notifications à droite.
 * Sur grand écran (barre latérale visible), seule la cloche reste, alignée à droite.
 */
export function AdminTopBar() {
  const { notifications, unreadCount, seenAt, markAllRead } = useAdminData();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const seenSnapshot = useRef(0);

  function openNotifications() {
    seenSnapshot.current = seenAt;
    setNotifOpen(true);
  }

  function closeNotifications() {
    markAllRead();
    setNotifOpen(false);
  }

  return (
    <>
      {/* Mobile */}
      <header className="sticky top-0 z-30 lg:hidden">
        <div className="flex items-center justify-between gap-3 border-b-2 border-[#D8B65C]/70 bg-gradient-to-r from-ocean-800 to-ocean-700 px-4 py-3 text-white shadow-md shadow-ocean-900/20">
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label="Ouvrir mon profil"
            className="flex min-w-0 items-center gap-3 rounded-2xl text-left transition-transform active:scale-95"
          >
            <Logo size={42} className="flex-shrink-0 ring-2 ring-[#D8B65C]" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold tracking-wide">
                {ASSOCIATION_NAME}
              </span>
              <span className="block text-[11px] font-medium text-ocean-100/80">
                Espace administrateur
              </span>
            </span>
          </button>
          <BellButton count={unreadCount} onClick={openNotifications} tone="dark" />
        </div>
      </header>

      {/* Grand écran */}
      <div className="hidden items-center justify-end gap-3 px-8 pt-6 lg:flex">
        <BellButton count={unreadCount} onClick={openNotifications} tone="light" />
      </div>

      <NotificationsSheet
        open={notifOpen}
        onClose={closeNotifications}
        notifications={notifications}
        seenAtSnapshot={seenSnapshot.current}
        onMarkAllRead={markAllRead}
      />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}