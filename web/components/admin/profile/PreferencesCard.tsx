//web/components/admin/profile/PreferencesCard.tsx
'use client';

import { useState } from 'react';
import { BellRing, SlidersHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { useSession } from '@/components/admin/SessionProvider';
import { Notice, Section, type Flash } from './Section';
import { apiAdmin, ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { fmt } from '@/lib/i18n/pair';
import type { AdminProfile } from '@/lib/types';

export function PreferencesCard({ delay }: { delay?: number }) {
  const { session, updateAdmin } = useSession();
  const { admin } = session;
  const { t } = useI18n();
  const tp = t.admin.account.preferences;

  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);
  // Tant que le profil n'est pas rechargé, le serveur considère l'option activée (valeur par défaut)
  const enabled = admin.notifyFormRequests ?? true;

  async function toggle() {
    if (saving) return;
    const next = !enabled;
    setFlash(null);
    setSaving(true);
    updateAdmin({ notifyFormRequests: next }); // affichage immédiat, annulé en cas d'échec
    try {
      const updated = (await apiAdmin('/admin/profile', session.accessToken, {
        method: 'PATCH',
        body: JSON.stringify({ notifyFormRequests: next }),
      })) as AdminProfile;
      updateAdmin(updated);
    } catch (err) {
      updateAdmin({ notifyFormRequests: enabled });
      setFlash({ kind: 'error', text: err instanceof ApiError ? err.message : tp.failed });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section icon={SlidersHorizontal} title={tp.title} description={tp.description} delay={delay}>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={toggle}
          disabled={saving}
          className="flex w-full items-center gap-3 rounded-2xl border border-ocean-100 bg-ocean-50/40 px-3.5 py-3 text-left transition-colors hover:bg-ocean-50 active:bg-ocean-100/60 disabled:opacity-70"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-ocean-600 shadow-sm">
            <BellRing className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-ocean-800">{tp.formRequests}</span>
            <span className="block text-xs leading-snug text-ocean-500">{tp.formRequestsText}</span>
            {enabled && (
              <span className="mt-0.5 block truncate text-xs font-medium text-ocean-400">
                {fmt(tp.sentTo, { email: admin.email })}
              </span>
            )}
          </span>
          <span
            className={clsx(
              'relative h-7 w-12 flex-shrink-0 rounded-full transition-colors duration-300',
              enabled ? 'bg-emerald-500' : 'bg-slate-300',
            )}
          >
            <span
              className={clsx(
                'absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300',
                enabled && 'translate-x-5',
              )}
            />
            <span className="sr-only">{enabled ? tp.on : tp.off}</span>
          </span>
        </button>
        <Notice flash={flash} />
      </div>
    </Section>
  );
}
