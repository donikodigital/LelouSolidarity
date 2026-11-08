'use client';

//web/components/ui/Badge.tsx
import clsx from 'clsx';
import { CardStatus, MemberStatus } from '@/lib/types';
import { useT } from '@/lib/i18n/I18nProvider';

const cardStatusStyles: Record<CardStatus, string> = {
  NONE: 'bg-slate-100 text-slate-600',
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  EXPIRING_SOON: 'bg-amber-50 text-amber-700',
  EXPIRED: 'bg-red-50 text-red-600',
};

const memberStatusStyles: Record<MemberStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  VALIDATED: 'bg-emerald-50 text-emerald-700',
};

export function CardStatusBadge({ status }: { status: CardStatus }) {
  const t = useT();
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        cardStatusStyles[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {t.common.cardStatus[status]}
    </span>
  );
}

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  const t = useT();
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        memberStatusStyles[status],
      )}
    >
      {t.common.memberStatus[status]}
    </span>
  );
}