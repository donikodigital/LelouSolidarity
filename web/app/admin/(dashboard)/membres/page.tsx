//web/app/admin/(dashboard)/membres/page.tsx
// v1.1 — filtres regroupés dans une barre alignée (grille : 3 + 2 sur mobile,
// une seule ligne sur grand écran) ; grille de cartes « grid-cols-1 + min-w-0 »
// pour supprimer le défilement horizontal sur mobile ; accents rétablis.
'use client';

import { useMemo, useState } from 'react';
import { Users, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { useMembers } from '@/lib/hooks/useMembers';
import { MemberListCard } from '@/components/admin/MemberListCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Member } from '@/lib/types';
import { useI18n } from '@/lib/i18n/I18nProvider';

type FilterKey = 'ALL' | 'PENDING' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';

const FILTER_KEYS: FilterKey[] = ['ALL', 'PENDING', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED'];

function matchesFilter(member: Member, filter: FilterKey): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'PENDING') return member.status === 'PENDING';
  return member.cardStatus === filter;
}

export default function MembresPage() {
  const { t } = useI18n();
  const tm = t.admin.members;
  const { members, loading, error } = useMembers();
  const [active, setActive] = useState<FilterKey>('ALL');

  const filtered = useMemo(
    () => (members || []).filter((m) => matchesFilter(m, active)),
    [members, active],
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ocean-800 sm:text-3xl">
          {tm.title}
        </h1>
        <p className="mt-1 text-sm text-ocean-400">
          {tm.subtitle}
        </p>
      </div>

      {/* Barre de filtres : 6 colonnes sur mobile (3 boutons sur la 1re ligne,
          2 plus larges sur la 2e), 5 colonnes égales sur grand écran. */}
      <div
        role="group"
        aria-label={tm.filterAria}
        className="grid grid-cols-6 gap-1.5 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200 sm:grid-cols-5"
      >
        {FILTER_KEYS.map((key, index) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActive(key)}
              className={clsx(
                'rounded-xl px-2 py-2.5 text-center text-[13px] font-semibold leading-tight transition-all sm:text-sm',
                index < 3 ? 'col-span-2 sm:col-span-1' : 'col-span-3 sm:col-span-1',
                isActive
                  ? 'bg-ocean-700 text-white shadow-md shadow-ocean-800/25'
                  : 'text-ocean-600 hover:bg-ocean-50',
              )}
            >
              {tm.filters[key]}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title={tm.emptyTitle}
          description={tm.emptyText}
        />
      )}

      {!loading && filtered.length > 0 && (
        // grid-cols-1 = une colonne de largeur « minmax(0, 1fr) » : sans elle, la
        // colonne s'élargit au contenu le plus long et la page défile à l'horizontale.
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 [&>*]:min-w-0">
          {filtered.map((member) => (
            <MemberListCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}