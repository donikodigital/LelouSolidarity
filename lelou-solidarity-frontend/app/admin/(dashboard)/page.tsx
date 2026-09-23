'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Clock3, CheckCircle2, AlertTriangle, XCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { useMembers } from '@/lib/hooks/useMembers';
import { StatCard } from '@/components/admin/StatCard';
import { MemberListCard } from '@/components/admin/MemberListCard';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminDashboardPage() {
  const { members, loading, error } = useMembers();

  const counts = useMemo(() => {
    const list = members || [];
    return {
      pending: list.filter((m) => m.status === 'PENDING').length,
      active: list.filter((m) => m.cardStatus === 'ACTIVE').length,
      expiringSoon: list.filter((m) => m.cardStatus === 'EXPIRING_SOON').length,
      expired: list.filter((m) => m.cardStatus === 'EXPIRED').length,
    };
  }, [members]);

  const recentPending = useMemo(
    () => (members || []).filter((m) => m.status === 'PENDING').slice(0, 4),
    [members],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ocean-800">Tableau de bord</h1>
        <p className="mt-1 text-sm text-ocean-400">Vue d&apos;ensemble des membres et des cartes.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Clock3} label="Demandes en attente" value={counts.pending} tone="amber" />
            <StatCard icon={CheckCircle2} label="Cartes actives" value={counts.active} tone="emerald" />
            <StatCard icon={AlertTriangle} label="A renouveler" value={counts.expiringSoon} tone="amber" />
            <StatCard icon={XCircle} label="Cartes expirees" value={counts.expired} tone="red" />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ocean-400">
                Demandes en attente de traitement
              </h2>
              <Link
                href="/admin/membres"
                className="inline-flex items-center gap-1 text-sm font-semibold text-ocean-600 hover:text-ocean-700"
              >
                Voir tout <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentPending.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="h-8 w-8" />}
                title="Aucune demande en attente"
                description="Toutes les demandes recues ont ete traitees."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {recentPending.map((member) => (
                  <MemberListCard key={member.id} member={member} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
