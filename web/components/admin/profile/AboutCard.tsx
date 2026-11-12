//web/components/admin/profile/AboutCard.tsx
// Association, ancienneté du compte, accès au site public et déconnexion.
'use client';

import Link from 'next/link';
import { ExternalLink, Info, LogOut } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/components/admin/SessionProvider';
import { Section } from './Section';
import { ASSOCIATION_NAME, FOUNDED_YEAR } from '@/lib/constants';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { fmt } from '@/lib/i18n/pair';

export function AboutCard({ delay }: { delay?: number }) {
  const { session, logout } = useSession();
  const { t, intl } = useI18n();
  const tb = t.admin.account.about;

  const created = session.admin.createdAt
    ? new Date(session.admin.createdAt).toLocaleDateString(intl, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <Section icon={Info} title={tb.title} delay={delay} className="lg:col-span-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Logo size={52} ring className="flex-shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold tracking-wide text-ocean-800">{ASSOCIATION_NAME}</p>
            <p className="text-xs font-semibold text-[#9A7B2F]">{fmt(tb.since, { year: FOUNDED_YEAR })}</p>
            {created && (
              <p className="mt-0.5 text-xs text-ocean-500">
                {tb.account} {created}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:w-64">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-ocean-50 px-4 py-2.5 text-sm font-semibold text-ocean-700 transition-colors hover:bg-ocean-100"
          >
            <ExternalLink className="h-4 w-4" />
            {tb.website}
          </Link>
          <Button variant="danger-solid" onClick={logout}>
            <LogOut className="h-4 w-4" />
            {t.admin.nav.logout}
          </Button>
        </div>
      </div>
    </Section>
  );
}
