//web/components/admin/AccessCodeCard.tsx
// v1.1 — carte cliquable (ouvre la modale de detail/actions)
'use client';

import Link from 'next/link';
import { KeyboardEvent } from 'react';
import { CheckCircle2, Clock3 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/format';
import { AccessCodeRecord } from '@/lib/types';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { fmt } from '@/lib/i18n/pair';

interface AccessCodeCardProps {
  record: AccessCodeRecord;
  onClick?: () => void;
}

export function AccessCodeCard({ record, onClick }: AccessCodeCardProps) {
  const { t, locale } = useI18n();
  const tc = t.admin.codes;
  return (
    <Card
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e: KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`flex items-center gap-4 p-4 ${
        onClick
          ? 'cursor-pointer transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-300'
          : ''
      }`}
    >
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
          record.used ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
        }`}
      >
        {record.used ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-bold text-ocean-800">{record.email}</p>
          <span className="rounded-full bg-ocean-50 px-2 py-0.5 text-xs font-semibold tracking-widest text-ocean-600">
            {record.code}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-ocean-400">
          {fmt(tc.sentOn, { date: formatDate(record.createdAt, locale) })}
          {record.used && record.member && (
            <>
              {' '}
              &middot; {tc.usedBy}{' '}
              <Link
                href={`/admin/membres/${record.member.id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-ocean-600 hover:underline"
              >
                {record.member.firstName} {record.member.lastName}
              </Link>
            </>
          )}
        </p>
      </div>
      <span
        className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
          record.used ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}
      >
        {record.used ? tc.used : tc.pending}
      </span>
    </Card>
  );
}