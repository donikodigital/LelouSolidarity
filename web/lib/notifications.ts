//web/lib/notifications.ts
// Notifications de l'espace admin : calculées à partir des données existantes
// (demandes de formulaire, demandes d'adhésion, cartes à renouveler / expirées).
import { FormRequest, Member } from './types';
import { fmt } from './i18n/pair';
import type { Dictionary } from './i18n';

export type NotificationKind =
  | 'form-request'
  | 'member-pending'
  | 'card-expiring'
  | 'card-expired';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Date de l'événement (ISO) : sert au tri et à la détection « non lu ». */
  date: string;
  href: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
// Le rappel « à renouveler » part 30 jours avant l'expiration
const REMINDER_DAYS = 30;
const MAX_NOTIFICATIONS = 40;

function formatShortDate(iso: string | null, intl: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(intl);
}

export function buildNotifications(
  members: Member[],
  requests: FormRequest[],
  t: Dictionary,
  intl: string,
): AppNotification[] {
  const items: AppNotification[] = [];

  for (const r of requests) {
    if (r.handled) continue;
    items.push({
      id: `req-${r.id}`,
      kind: 'form-request',
      title: t.notif.formRequestTitle,
      body: `${r.firstName} ${r.lastName.toUpperCase()} · ${r.city}`,
      date: r.createdAt,
      href: '/admin/demandes',
    });
  }

  for (const m of members) {
    const name = `${m.firstName} ${m.lastName.toUpperCase()}`;
    const href = `/admin/membres/${m.id}`;

    if (m.status === 'PENDING') {
      items.push({
        id: `mem-${m.id}`,
        kind: 'member-pending',
        title: t.notif.memberPendingTitle,
        body: name,
        date: m.createdAt,
        href,
      });
    }

    if (m.cardStatus === 'EXPIRING_SOON') {
      const expires = m.cardExpiresAt ? Date.parse(m.cardExpiresAt) : NaN;
      items.push({
        id: `exp-${m.id}`,
        kind: 'card-expiring',
        title: t.notif.cardExpiringTitle,
        body: fmt(t.notif.cardExpiringBody, { name, date: formatShortDate(m.cardExpiresAt, intl) }),
        // Date du rappel (J-30), pas celle de l'expiration (dans le futur)
        date: Number.isNaN(expires)
          ? m.createdAt
          : new Date(expires - REMINDER_DAYS * DAY_MS).toISOString(),
        href,
      });
    }

    if (m.cardStatus === 'EXPIRED') {
      items.push({
        id: `end-${m.id}`,
        kind: 'card-expired',
        title: t.notif.cardExpiredTitle,
        body: name,
        date: m.cardExpiresAt ?? m.createdAt,
        href,
      });
    }
  }

  return items
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, MAX_NOTIFICATIONS);
}

export function timeAgo(iso: string, t: Dictionary, intl: string): string {
  const diff = Date.now() - Date.parse(iso);
  if (Number.isNaN(diff)) return '';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return t.notif.justNow;
  if (minutes < 60) return fmt(t.notif.minutesAgo, { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return fmt(t.notif.hoursAgo, { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return fmt(t.notif.daysAgo, { n: days });
  return new Date(iso).toLocaleDateString(intl);
}
