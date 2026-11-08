//web/app/admin/(dashboard)/codes/page.tsx
// v1.3 — grille « grid-cols-1 + min-w-0 » : les cartes ne dépassent plus de
// l'écran sur mobile (plus de défilement horizontal) ; accents rétablis.
// v1.2 — ouverture de la modale au clic sur une carte
'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { AccessCodeCard } from '@/components/admin/AccessCodeCard';
import { AccessCodeModal } from '@/components/admin/AccessCodeModal';
import { useSession } from '@/components/admin/SessionProvider';
import { apiAdmin, ApiError } from '@/lib/api';
import { AccessCodeRecord } from '@/lib/types';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { fmt } from '@/lib/i18n/pair';
import { LOCALES, LOCALE_META, type Locale } from '@/lib/i18n/config';
import { Flag } from '@/components/layout/LanguageSwitcher';

export default function CodesPage() {
  const { session } = useSession();
  const { t, locale } = useI18n();
  const tc = t.admin.codes;
  const [codes, setCodes] = useState<AccessCodeRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  // Langue de l'e-mail du code : par défaut celle de l'interface, modifiable
  const [mailLocaleChoice, setMailLocaleChoice] = useState<Locale | null>(null);
  const mailLocale = mailLocaleChoice ?? locale;

  const [selected, setSelected] = useState<AccessCodeRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiAdmin('/admin/access-codes', session.accessToken);
      setCodes(data);
    } catch {
      setLoadError(tc.loadError);
    } finally {
      setLoading(false);
    }
  }, [session.accessToken, tc.loadError]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSendError(null);
    setSendSuccess(null);
    setSending(true);
    try {
      await apiAdmin('/admin/access-codes', session.accessToken, {
        method: 'POST',
        body: JSON.stringify({ email, locale: mailLocale }),
      });
      setSendSuccess(fmt(tc.sentTo, { email }));
      setEmail('');
      load();
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : tc.sendFailed);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ocean-800 sm:text-3xl">
          {tc.title}
        </h1>
        <p className="mt-1 text-sm text-ocean-400">
          {tc.subtitle}
        </p>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-ocean-700">
          <KeyRound className="h-4 w-4" />
          <h2 className="text-sm font-bold uppercase tracking-wide">{tc.sendNew}</h2>
        </div>

        {sendError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> <span className="min-w-0">{sendError}</span>
          </div>
        )}
        {sendSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />{' '}
            <span className="min-w-0 break-words">{sendSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Input
              label={tc.memberEmail}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
            />
          </div>
          <Button type="submit" loading={sending}>
            <Send className="h-4 w-4" />
            {tc.sendCode}
          </Button>
        </form>

        {/* Langue de l'e-mail envoyé au futur membre */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-ocean-500">{tc.emailLanguage}</span>
          <div role="group" aria-label={tc.emailLanguage} className="inline-flex gap-1 rounded-full bg-ocean-50 p-1">
            {LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={mailLocale === code}
                onClick={() => setMailLocaleChoice(code)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  mailLocale === code
                    ? 'bg-white text-ocean-800 shadow-sm'
                    : 'text-ocean-500 hover:text-ocean-700'
                }`}
              >
                <Flag locale={code} className="h-3 w-[18px]" />
                {LOCALE_META[code].short}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex min-w-0 flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ocean-400">
          {tc.alreadySent}
        </h2>

        {loading && (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6" />
          </div>
        )}

        {loadError && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {loadError}
          </div>
        )}

        {!loading && codes && codes.length === 0 && (
          <EmptyState
            icon={<KeyRound className="h-8 w-8" />}
            title={tc.emptyTitle}
            description={tc.emptyText}
          />
        )}

        {!loading && codes && codes.length > 0 && (
          // grid-cols-1 = une colonne de largeur « minmax(0, 1fr) » : sans elle, la
          // colonne s'élargit au contenu le plus long et la page défile à l'horizontale.
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 [&>*]:min-w-0">
            {codes.map((record) => (
              <AccessCodeCard key={record.id} record={record} onClick={() => setSelected(record)} />
            ))}
          </div>
        )}
      </div>

      <AccessCodeModal
        record={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onChanged={load}
      />
    </div>
  );
}