import clsx from 'clsx';
import { CardStatus, MemberStatus } from '@/lib/types';

const cardStatusStyles: Record<CardStatus, string> = {
  NONE: 'bg-slate-100 text-slate-600',
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  EXPIRING_SOON: 'bg-amber-50 text-amber-700',
  EXPIRED: 'bg-red-50 text-red-600',
};

const cardStatusLabels: Record<CardStatus, string> = {
  NONE: 'Pas de carte',
  ACTIVE: 'Active',
  EXPIRING_SOON: 'A renouveler',
  EXPIRED: 'Expiree',
};

const memberStatusStyles: Record<MemberStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  VALIDATED: 'bg-emerald-50 text-emerald-700',
};

const memberStatusLabels: Record<MemberStatus, string> = {
  PENDING: 'En attente',
  VALIDATED: 'Traite',
};

export function CardStatusBadge({ status }: { status: CardStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        cardStatusStyles[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {cardStatusLabels[status]}
    </span>
  );
}

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        memberStatusStyles[status],
      )}
    >
      {memberStatusLabels[status]}
    </span>
  );
}
