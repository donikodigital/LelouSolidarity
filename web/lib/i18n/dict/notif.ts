//web/lib/i18n/dict/notif.ts
import { pair } from '../pair';

export const notif = pair(
  {
    formRequestTitle: 'Nouvelle demande de formulaire',
    memberPendingTitle: 'Nouvelle demande d’adhésion',
    cardExpiringTitle: 'Carte à renouveler',
    cardExpiringBody: '{name} · expire le {date}',
    cardExpiredTitle: 'Carte expirée',
    justNow: 'À l’instant',
    minutesAgo: 'Il y a {n} min',
    hoursAgo: 'Il y a {n} h',
    daysAgo: 'Il y a {n} j',
  },
  {
    formRequestTitle: 'New form request',
    memberPendingTitle: 'New membership request',
    cardExpiringTitle: 'Card to renew',
    cardExpiringBody: '{name} · expires on {date}',
    cardExpiredTitle: 'Card expired',
    justNow: 'Just now',
    minutesAgo: '{n} min ago',
    hoursAgo: '{n} h ago',
    daysAgo: '{n} d ago',
  },
);
