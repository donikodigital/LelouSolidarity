//web/app/admin/(dashboard)/page.tsx
// v1.2 — refonte mobile : carte d'accueil dégradée, cartes de statistiques
// animées et cliquables, apparition en cascade. Les données viennent du
// NotificationsProvider (un seul chargement pour tout l'espace admin).
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Clock3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  AlertCircle,
  Inbox,
  Users,
} from 'lucide-react';
import clsx from 'clsx';
import { useAdminData } from '@/components/admin/NotificationsProvider';
import { useSession } from '@/components/admin/SessionProvider';
import { StatCard } from '@/components/admin/StatCard';
import { MemberListCard } from '@/components/admin/MemberListCard';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminDashboardPage() {
  const { members, loading, error, requestsToHandle } = useAdminData();
  const { session } = useSession();

  const counts = useMemo(() => {
    const list = members || [];
    return {
      total: list.length,
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

  const today = useMemo(() => {
    const label = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, []);

  const firstName = session.admin.name?.trim().split(/\s+/)[0];

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      {/* Carte d'accueil */}
      <section className="animate-rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-ocean-700 via-ocean-600 to-ocean-500 p-5 text-white shadow-xl shadow-ocean-900/20 sm:p-7">
        <span className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#D8B65C]/30 blur-2xl" />
        <span className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F3E2A9]">{today}</p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {firstName ? `Bonjour, ${firstName}` : 'Bonjour'}
          </h1>
          <p className="mt-1 text-sm text-ocean-100">Vue d&apos;ensemble des membres et des cartes.</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/admin/membres"
              className="group flex min-w-0 items-center gap-3 rounded-2xl bg-white/10 px-3.5 py-3 ring-1 ring-white/15 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15 active:scale-95"
            >
              <Users className="h-5 w-5 flex-shrink-0 text-ocean-100" />
              <span className="min-w-0">
                <span className="block text-xl font-extrabold leading-none">{counts.total}</span>
                <span className="mt-1 block truncate text-[11px] font-medium text-ocean-100">
                  Membres enregistrés
                </span>
              </span>
            </Link>
            <Link
              href="/admin/demandes"
              className={clsx(
                'group flex min-w-0 items-center gap-3 rounded-2xl px-3.5 py-3 ring-1 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 active:scale-95',
                requestsToHandle > 0
                  ? 'bg-[#D8B65C]/25 ring-[#F3E2A9]/50 hover:bg-[#D8B65C]/35'
                  : 'bg-white/10 ring-white/15 hover:bg-white/15',
              )}
            >
              <Inbox className="h-5 w-5 flex-shrink-0 text-ocean-100" />
              <span className="min-w-0">
                <span className="block text-xl font-extrabold leading-none">{requestsToHandle}</span>
                <span className="mt-1 block truncate text-[11px] font-medium text-ocean-100">
                  Formulaires à envoyer
                </span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              icon={Clock3}
              label="Demandes en attente"
              value={counts.pending}
              tone="amber"
              href="/admin/membres"
              delay={60}
            />
            <StatCard
              icon={CheckCircle2}
              label="Cartes actives"
              value={counts.active}
              tone="emerald"
              href="/admin/membres"
              delay={120}
            />
            <StatCard
              icon={AlertTriangle}
              label="À renouveler"
              value={counts.expiringSoon}
              tone="amber"
              href="/admin/membres"
              delay={180}
            />
            <StatCard
              icon={XCircle}
              label="Cartes expirées"
              value={counts.expired}
              tone="red"
              href="/admin/membres"
              delay={240}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ocean-400">
                <span className="h-4 w-1 rounded-full bg-gradient-to-b from-[#F3E2A9] to-[#9A7B2F]" />
                Adhésions à traiter
              </h2>
              <Link
                href="/admin/membres"
                className="group inline-flex flex-shrink-0 items-center gap-1 text-sm font-semibold text-ocean-600 hover:text-ocean-700"
              >
                Voir tout
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {recentPending.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="h-8 w-8" />}
                title="Aucune demande en attente"
                description="Toutes les demandes reçues ont été traitées."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 [&>*]:min-w-0">
                {recentPending.map((member, i) => (
                  <div
                    key={member.id}
                    className="animate-rise"
                    style={{ animationDelay: `${300 + i * 70}ms` }}
                  >
                    <MemberListCard member={member} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}