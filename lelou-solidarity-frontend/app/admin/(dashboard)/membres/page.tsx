'use client';

import { useMemo, useState } from 'react';
import { Users, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { useMembers } from '@/lib/hooks/useMembers';
import { MemberListCard } from '@/components/admin/MemberListCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Member } from '@/lib/types';

type FilterKey = 'ALL' | 'PENDING' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';

const filters: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'Tous' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'ACTIVE', label: 'Actifs' },
  { key: 'EXPIRING_SOON', label: 'A renouveler' },
  { key: 'EXPIRED', label: 'Expires' },
];

function matchesFilter(member: Member, filter: FilterKey): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'PENDING') return member.status === 'PENDING';
  return member.cardStatus === filter;
}

export default function MembresPage() {
  const { members, loading, error } = useMembers();
  const [active, setActive] = useState<FilterKey>('ALL');

  const filtered = useMemo(
    () => (members || []).filter((m) => matchesFilter(m, active)),
    [members, active],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ocean-800">Membres</h1>
        <p className="mt-1 text-sm text-ocean-400">
          Demandes d&apos;adhesion recues et cartes de membre.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActive(f.key)}
            className={clsx(
              'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
              active === f.key
                ? 'bg-ocean-500 text-white'
                : 'bg-white text-ocean-600 hover:bg-ocean-100 border border-ocean-100',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Aucun membre dans cette categorie"
          description="Les nouvelles demandes soumises via le formulaire public apparaitront ici."
        />
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((member) => (
            <MemberListCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
