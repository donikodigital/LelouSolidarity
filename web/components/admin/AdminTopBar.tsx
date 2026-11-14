//web/components/admin/AdminTopBar.tsx
// v1.1 — l'en-tête mobile n'est plus collé en haut quand le clavier du téléphone est ouvert.
'use client';

import { useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import clsx from 'clsx';
import { Logo } from '@/components/layout/Logo';
import { ASSOCIATION_NAME } from '@/lib/constants';
import { useAdminData } from './NotificationsProvider';
import { NotificationsSheet } from './NotificationsSheet';
import { ProfileSheet } from './ProfileSheet';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { fmt } from '@/lib/i18n/pair';

function BellButton({
  count,
  onClick,
  tone,
}: {
  count: number;
  onClick: () => void;
  tone: 'dark' | 'light';
}) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        count > 0
          ? fmt(t.admin.topbar.notificationsUnread, { n: count })
          : t.admin.topbar.notifications
      }
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
  const { t } = useI18n();
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
      {/* kb:static : clavier ouvert, l'en-tête n'est plus collé en haut (≈ 66 px rendus à la saisie) ;
          il garde sa place dans la page, donc aucun saut de contenu. */}
      <header className="sticky top-0 z-30 kb:static lg:hidden">
        <div className="flex items-center justify-between gap-3 border-b-2 border-[#D8B65C]/70 bg-gradient-to-r from-ocean-800 to-ocean-700 px-3 py-3 min-[360px]:px-4 text-white shadow-md shadow-ocean-900/20">
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label={t.admin.topbar.openProfile}
            className="flex min-w-0 items-center gap-2 rounded-2xl min-[360px]:gap-3 text-left transition-transform active:scale-95"
          >
            <Logo size={38} className="flex-shrink-0 ring-2 ring-[#D8B65C]" />
            <span className="min-w-0">
              <span className="block break-words text-[13px] font-extrabold leading-tight tracking-normal min-[360px]:text-sm min-[360px]:tracking-wide">
                {ASSOCIATION_NAME}
              </span>
              <span className="mt-0.5 block text-[11px] font-medium leading-tight text-ocean-100/80">
                {t.admin.adminSpace}
              </span>
            </span>
          </button>
          <div className="flex flex-shrink-0 items-center gap-1.5 min-[360px]:gap-2">
            <LanguageSwitcher align="right" />
            <BellButton count={unreadCount} onClick={openNotifications} tone="dark" />
          </div>
        </div>
      </header>

      {/* Grand écran */}
      <div className="hidden items-center justify-end gap-3 px-8 pt-6 lg:flex">
        <LanguageSwitcher align="right" className="rounded-full ring-1 ring-ocean-100" />
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