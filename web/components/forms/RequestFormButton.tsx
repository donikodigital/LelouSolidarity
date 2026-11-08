//web/components/forms/RequestFormButton.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Mail, Send } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiPublic, ApiError } from '@/lib/api';
import { formatUsPhoneInput } from '@/lib/format';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { LOCALES } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n';

const ROW = 'grid grid-cols-2 items-end gap-3 [&>*]:min-w-0';
// Pays / téléphone : côte à côte dès sm, empilés sur mobile (le téléphone « +1 (718) 555-0123 » a besoin de largeur)
const ROW_RESPONSIVE = 'grid grid-cols-1 items-end gap-3 sm:grid-cols-2 [&>*]:min-w-0';

// Pays proposé par défaut selon la langue (FR : États-Unis, EN : United States)
const DEFAULT_COUNTRIES = LOCALES.map((l) => getDictionary(l).forms.defaultCountry);

interface RequestState {
  firstName: string;
  lastName: string;
  city: string;
  state: string;
  country: string;
  phone: string; // saisi sans l'indicatif : « (718) 555-0123 », le « +1 » est ajouté à l'envoi
  email: string;
  website: string; // champ piège anti-robots (toujours vide chez un humain)
}

const makeInitialState = (country: string): RequestState => ({
  firstName: '',
  lastName: '',
  city: '',
  state: '',
  country,
  phone: '',
  email: '',
  website: '',
});

export function RequestFormButton() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RequestState>(() => makeInitialState(t.forms.defaultCountry));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Changement de langue : si le pays est encore celui par défaut, on le traduit
  useEffect(() => {
    setForm((prev) =>
      DEFAULT_COUNTRIES.includes(prev.country) ? { ...prev, country: t.forms.defaultCountry } : prev,
    );
  }, [locale, t.forms.defaultCountry]);

  function update<K extends keyof RequestState>(key: K, value: RequestState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function close() {
    setOpen(false);
    // Après un envoi réussi, on repart d'un formulaire vide à la prochaine ouverture
    if (done) {
      setForm(makeInitialState(t.forms.defaultCountry));
      setDone(false);
    }
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Les membres résident aux États-Unis : numéro à 10 chiffres, indicatif +1 ajouté automatiquement
    if (form.phone.replace(/\D/g, '').length !== 10) {
      setError(t.forms.phoneInvalid);
      return;
    }

    setSending(true);
    try {
      await apiPublic('/public/form-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, phone: `+1 ${form.phone.trim()}` }),
      });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 429 ? t.forms.request.tooMany : err.message,
        );
      } else {
        setError(t.forms.request.networkError);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-8 inline-flex items-center justify-center gap-2.5 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-ocean-700 shadow-lg shadow-ocean-900/20 ring-2 ring-[#D8B65C]/70 transition-transform hover:scale-[1.02] hover:bg-ocean-50 sm:text-base"
      >
        <Mail className="h-5 w-5 flex-shrink-0" />
        {t.forms.request.openButton}
      </button>

      <Modal
        open={open}
        onClose={close}
        size="lg"
        title={done ? undefined : t.forms.request.modalTitle}
      >
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-extrabold tracking-tight text-ocean-800">
              {t.forms.request.sentTitle}
            </h3>
            <p className="text-sm leading-relaxed text-ocean-500">
              {t.forms.request.sentText}
            </p>
            <Button className="mt-2" onClick={close}>
              {t.common.close}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Message type qui accompagnera les informations */}
            <blockquote className="rounded-xl border-l-4 border-[#D8B65C] bg-ocean-50/70 px-4 py-3 text-sm leading-relaxed text-ocean-700">
              {t.forms.request.message}
            </blockquote>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span className="min-w-0">{error}</span>
              </div>
            )}

            <div className={ROW}>
              <Input
                label={t.forms.labels.firstName}
                name="firstName"
                autoComplete="given-name"
                required
                maxLength={80}
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
              />
              <Input
                label={t.forms.labels.lastName}
                name="lastName"
                autoComplete="family-name"
                required
                maxLength={80}
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
              />
            </div>
            <div className={ROW}>
              <Input
                label={t.forms.labels.city}
                name="city"
                autoComplete="address-level2"
                required
                maxLength={100}
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
              />
              <Input
                label={t.forms.labels.state}
                name="state"
                autoComplete="address-level1"
                placeholder="New York"
                required
                maxLength={80}
                value={form.state}
                onChange={(e) => update('state', e.target.value)}
              />
            </div>
            <div className={ROW_RESPONSIVE}>
              <Input
                label={t.forms.labels.country}
                name="country"
                autoComplete="country-name"
                required
                maxLength={80}
                value={form.country}
                onChange={(e) => update('country', e.target.value)}
              />
              {/* Mise en forme automatique pendant la saisie : (718) 555-0123 */}
              <Input
                label={t.forms.labels.phone}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(718) 555-0123"
                required
                maxLength={14}
                leading="+1"
                value={form.phone}
                onChange={(e) => update('phone', formatUsPhoneInput(e.target.value))}
              />
            </div>
            <Input
              label={t.forms.labels.email}
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={160}
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />

            {/* Champ piège : invisible et hors de portée du clavier, seuls les robots le remplissent */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                {t.forms.request.honeypot}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(e) => update('website', e.target.value)}
                />
              </label>
            </div>

            <Button type="submit" size="lg" loading={sending} className="mt-1 w-full">
              {!sending && <Send className="h-4 w-4" />}
              {sending ? t.forms.sending : t.forms.sendRequest}
            </Button>
            <p className="text-center text-xs text-slate-500">
              {t.forms.allRequired}
            </p>
          </form>
        )}
      </Modal>
    </>
  );
}