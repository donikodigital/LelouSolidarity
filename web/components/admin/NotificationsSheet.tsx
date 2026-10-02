//web/components/admin/NotificationsSheet.tsx
'use client';

import Link from 'next/link';
import { AlertTriangle, Bell, CheckCheck, Inbox, UserPlus, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { ComponentType } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { AppNotification, NotificationKind, timeAgo } from '@/lib/notifications';

const KINDS: Record<
  NotificationKind,
  { icon: ComponentType<{ className?: string }>; tone: string }
> = {
  'form-request': { icon: Inbox, tone: 'bg-[#D8B65C]/20 text-[#9A7B2F]' },
  'member-pending': { icon: UserPlus, tone: 'bg-ocean-50 text-ocean-600' },
  'card-expiring': { icon: AlertTriangle, tone: 'bg-amber-50 text-amber-600' },
  'card-expired': { icon: XCircle, tone: 'bg-red-50 text-red-600' },
};

interface NotificationsSheetProps {
  open: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  /** Date (ms) de dernière lecture au moment de l'ouverture : sert à repérer les non lues. */
  seenAtSnapshot: number;
  onMarkAllRead: () => void;
}

export function NotificationsSheet({
  open,
  onClose,
  notifications,
  seenAtSnapshot,
  onMarkAllRead,
}: NotificationsSheetProps) {
  const unread = notifications.filter((n) => Date.parse(n.date) > seenAtSnapshot).length;

  return (
    <Sheet open={open} onClose={onClose} title="Notifications">
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ocean-50 text-ocean-300">
            <Bell className="h-7 w-7" />
          </span>
          <p className="text-base font-semibold text-ocean-800">Aucune notification</p>
          <p className="max-w-xs text-sm text-ocean-500">
            Les nouvelles demandes et les cartes à renouveler apparaîtront ici.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-ocean-400">
              {unread > 0
                ? `${unread} non lue${unread > 1 ? 's' : ''}`
                : 'Tout est lu'}
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ocean-600 hover:text-ocean-800"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Tout marquer comme lu
              </button>
            )}
          </div>

          <ul className="flex flex-col gap-2">
            {notifications.map((n, i) => {
              const { icon: Icon, tone } = KINDS[n.kind];
              const isUnread = Date.parse(n.date) > seenAtSnapshot;
              return (
                <li
                  key={n.id}
                  className="animate-rise"
                  style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
                >
                  <Link
                    href={n.href}
                    onClick={onClose}
                    className={clsx(
                      'relative flex items-start gap-3 rounded-2xl border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]',
                      isUnread
                        ? 'border-[#D8B65C]/50 bg-amber-50/50'
                        : 'border-ocean-100/70 bg-white',
                    )}
                  >
                    <span
                      className={clsx(
                        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                        tone,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-ocean-800">{n.title}</span>
                      <span className="mt-0.5 block break-words text-xs text-ocean-500">
                        {n.body}
                      </span>
                      <span className="mt-1 block text-[11px] font-medium text-ocean-300">
                        {timeAgo(n.date)}
                      </span>
                    </span>
                    {isUnread && (
                      <span className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#D8B65C] ring-4 ring-[#D8B65C]/20" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Sheet>
  );
}