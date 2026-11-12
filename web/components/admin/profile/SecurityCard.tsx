//web/components/admin/profile/SecurityCard.tsx
// Sécurité du compte : mot de passe, adresse e-mail (deux volets dépliables), journal des
// connexions et déconnexion des autres appareils.
'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, History, KeyRound, LogOut, Mail, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useSession } from '@/components/admin/SessionProvider';
import { EmailForm } from './EmailForm';
import { PasswordForm } from './PasswordForm';
import { Notice, Section, type Flash } from './Section';
import { apiAdmin, ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n/I18nProvider';

function Disclosure({
  icon: Icon,
  title,
  subtitle,
  action,
  open,
  onToggle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ocean-100 bg-ocean-50/40">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-ocean-50 active:bg-ocean-100/60"
      >
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-ocean-600 shadow-sm">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-ocean-800">{title}</span>
          <span className="block truncate text-xs text-ocean-500">{subtitle}</span>
        </span>
        <span className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-ocean-600">
          {action}
          <ChevronDown className={clsx('h-4 w-4 transition-transform duration-300', open && 'rotate-180')} />
        </span>
      </button>
      {open && <div className="animate-rise border-t border-ocean-100 bg-white px-3.5 py-4">{children}</div>}
    </div>
  );
}

export function SecurityCard({ delay }: { delay?: number }) {
  const { session, updateAdmin } = useSession();
  const { admin } = session;
  const { t, intl } = useI18n();
  const ts = t.admin.account.security;

  const [open, setOpen] = useState<'password' | 'email' | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);

  const formatDate = (iso: string | null | undefined) =>
    iso
      ? new Date(iso).toLocaleString(intl, { dateStyle: 'long', timeStyle: 'short' })
      : null;

  const current = formatDate(admin.lastLoginAt);
  // Pas de « connexion précédente » : soit c'est la toute première, soit le profil n'est pas encore chargé
  const previous = formatDate(admin.previousLoginAt);

  function toggle(which: 'password' | 'email') {
    setFlash(null);
    setOpen(open === which ? null : which);
  }

  function done(message: string) {
    setOpen(null);
    setFlash({ kind: 'success', text: message });
  }

  async function revoke() {
    setRevoking(true);
    setFlash(null);
    try {
      const res = (await apiAdmin('/admin/profile/sessions/revoke', session.accessToken, {
        method: 'POST',
      })) as { accessToken: string };
      updateAdmin({}, res.accessToken);
      setConfirmOpen(false);
      setFlash({ kind: 'success', text: ts.sessions.done });
    } catch (err) {
      setConfirmOpen(false);
      setFlash({ kind: 'error', text: err instanceof ApiError ? err.message : ts.sessions.failed });
    } finally {
      setRevoking(false);
    }
  }

  return (
    <Section icon={ShieldCheck} title={ts.title} description={ts.description} delay={delay}>
      <div className="flex flex-col gap-3">
        <Disclosure
          icon={KeyRound}
          title={ts.password.title}
          subtitle={ts.password.hint}
          action={open === 'password' ? ts.close : ts.password.action}
          open={open === 'password'}
          onToggle={() => toggle('password')}
        >
          <PasswordForm onDone={done} />
        </Disclosure>

        <Disclosure
          icon={Mail}
          title={ts.email.title}
          subtitle={admin.email}
          action={open === 'email' ? ts.close : ts.email.action}
          open={open === 'email'}
          onToggle={() => toggle('email')}
        >
          <EmailForm onDone={done} />
        </Disclosure>

        {/* Journal des connexions */}
        <div className="rounded-2xl border border-ocean-100 bg-ocean-50/40 p-3.5">
          <div className="flex items-center gap-2 text-sm font-bold text-ocean-800">
            <History className="h-4 w-4 text-ocean-500" />
            {ts.sessions.title}
          </div>
          <dl className="mt-2.5 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div className="min-w-0 rounded-xl bg-white px-3 py-2 shadow-sm">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-ocean-400">{ts.sessions.current}</dt>
              <dd className="mt-0.5 break-words font-semibold text-ocean-800">{current ?? ts.sessions.unknown}</dd>
            </div>
            <div className="min-w-0 rounded-xl bg-white px-3 py-2 shadow-sm">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-ocean-400">{ts.sessions.previous}</dt>
              <dd className="mt-0.5 break-words font-semibold text-ocean-800">
                {previous ?? (current ? ts.sessions.first : ts.sessions.unknown)}
              </dd>
            </div>
          </dl>
          <p className="mt-2.5 text-xs leading-snug text-ocean-400">{ts.sessions.hint}</p>
          <Button variant="danger" className="mt-3 w-full" onClick={() => setConfirmOpen(true)}>
            <LogOut className="h-4 w-4" />
            {ts.sessions.revoke}
          </Button>
        </div>

        <Notice flash={flash} />
      </div>

      <Modal open={confirmOpen} onClose={() => !revoking && setConfirmOpen(false)} title={ts.sessions.confirmTitle}>
        <p className="text-sm leading-relaxed text-ocean-600">{ts.sessions.confirmText}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={revoking}>
            {ts.sessions.cancel}
          </Button>
          <Button variant="danger-solid" onClick={revoke} loading={revoking}>
            {ts.sessions.confirmYes}
          </Button>
        </div>
      </Modal>
    </Section>
  );
}
