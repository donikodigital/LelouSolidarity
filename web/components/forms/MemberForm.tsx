//web/components/forms/MemberForm.tsx
'use client';

import { ComponentType, FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  WifiOff,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhotoDropzone } from '@/components/ui/PhotoDropzone';
import { Logo } from '@/components/layout/Logo';
import { apiPublic, ApiError } from '@/lib/api';

interface FormState {
  code: string;
  firstName: string;
  lastName: string;
  birthYear: string;
  originDistrict: string;
  addressLine: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
}

const initialState: FormState = {
  code: '',
  firstName: '',
  lastName: '',
  birthYear: '',
  originDistrict: '',
  addressLine: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  email: '',
};

// Grilles de champs : 2 colonnes dès le mobile, sur toutes les tailles d'écran.
// - min-w-0 évite qu'un champ déborde de sa colonne sur petit écran
// - items-end aligne les champs même si un libellé passe sur 2 lignes
const ROW_EQUAL =
  'grid grid-cols-2 items-end gap-3 sm:gap-4 [&>*]:min-w-0';
const ROW_WIDE_NARROW =
  'grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-end gap-3 sm:gap-4 [&>*]:min-w-0';

// Liseré or réutilisé en haut des cartes
const GOLD_BAR = 'h-1.5 bg-gradient-to-r from-[#F3E2A9] via-[#D8B65C] to-[#9A7B2F]';

const MIN_BIRTH_YEAR = 1900;

// Délai au-delà duquel on prévient que le serveur se réveille (hébergement
// gratuit : la première requête après une période d'inactivité est lente).
const SLOW_CHECK_MS = 5000;

// Le lien du bouton « Remplir le formulaire » (dans l'e-mail) contient le code
// d'accès : /formulaire?code=XXXXXXXX
function readCodeFromUrl(raw: string | null): string {
  return (raw ?? '').trim().toUpperCase();
}

type AccessState = 'checking' | 'valid' | 'used' | 'invalid' | 'missing' | 'error';
type RemoteStatus = 'VALID' | 'USED' | 'INVALID';

// Demande au serveur si le lien est encore utilisable
async function fetchAccessStatus(code: string): Promise<RemoteStatus> {
  const res = await apiPublic(`/public/access-codes/${encodeURIComponent(code)}/status`);
  return res?.status === 'VALID' || res?.status === 'USED' ? res.status : 'INVALID';
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ocean-600 to-ocean-800 text-white shadow-sm shadow-ocean-800/30">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-ocean-700">
        {children}
      </h2>
      <span className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
    </div>
  );
}

// Carte centrée utilisée pour tous les écrans « message » (vérification,
// lien déjà utilisé, lien invalide, confirmation d'envoi...)
function MessageCard({
  children,
  withLogo = true,
}: {
  children: ReactNode;
  withLogo?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-lg overflow-hidden rounded-3xl bg-white text-center shadow-xl shadow-ocean-900/10 ring-1 ring-slate-900/5">
      <div className={GOLD_BAR} />
      <div className="flex flex-col items-center gap-4 px-5 py-12 sm:px-10 sm:py-14">
        {withLogo && <Logo size={72} ring />}
        {children}
      </div>
    </div>
  );
}

function StatusIcon({
  icon: Icon,
  tone,
  spin = false,
}: {
  icon: ComponentType<{ className?: string }>;
  tone: 'green' | 'amber' | 'red' | 'blue';
  spin?: boolean;
}) {
  const tones = {
    green: 'bg-emerald-50 text-emerald-600 ring-emerald-50/60',
    amber: 'bg-amber-50 text-amber-600 ring-amber-50/60',
    red: 'bg-red-50 text-red-600 ring-red-50/60',
    blue: 'bg-ocean-50 text-ocean-600 ring-ocean-50/60',
  };
  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-full ring-8 ${tones[tone]}`}>
      <Icon className={`h-7 w-7 ${spin ? 'animate-spin' : ''}`} />
    </div>
  );
}

const MESSAGE_TITLE = 'text-2xl font-extrabold tracking-tight text-ocean-800';
const MESSAGE_TEXT = 'text-sm leading-relaxed text-ocean-500';
const MESSAGE_BUTTON =
  'mt-2 inline-flex items-center justify-center rounded-xl bg-ocean-700 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-ocean-800/25 transition hover:bg-ocean-800';

export function MemberForm() {
  const searchParams = useSearchParams();
  const code = readCodeFromUrl(searchParams.get('code'));

  const [access, setAccess] = useState<AccessState>(code ? 'checking' : 'missing');
  const [slowCheck, setSlowCheck] = useState(false);
  const [checkAttempt, setCheckAttempt] = useState(0);

  const [form, setForm] = useState<FormState>(() => ({ ...initialState, code }));
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Vérification du lien à l'ouverture : un lien déjà utilisé ou inconnu
  // n'ouvre jamais le formulaire.
  useEffect(() => {
    if (!code) {
      setAccess('missing');
      return;
    }

    let cancelled = false;
    setAccess('checking');
    setSlowCheck(false);
    const slowTimer = setTimeout(() => setSlowCheck(true), SLOW_CHECK_MS);

    fetchAccessStatus(code)
      .then((status) => {
        if (cancelled) return;
        setAccess(status === 'VALID' ? 'valid' : status === 'USED' ? 'used' : 'invalid');
      })
      .catch(() => {
        // Serveur injoignable, en cours de réveil, ou trop de requêtes
        if (!cancelled) setAccess('error');
      })
      .finally(() => clearTimeout(slowTimer));

    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, [code, checkAttempt]);

  // Sur mobile, le message d'erreur est en haut du formulaire : on y ramène l'écran
  useEffect(() => {
    if (submitError && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [submitError]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const currentYear = new Date().getFullYear();
    const year = Number(form.birthYear);
    if (
      !/^\d{4}$/.test(form.birthYear) ||
      year < MIN_BIRTH_YEAR ||
      year > currentYear
    ) {
      setSubmitError(
        `Année de naissance invalide : indiquez 4 chiffres entre ${MIN_BIRTH_YEAR} et ${currentYear}.`,
      );
      return;
    }

    if (!photo) {
      setPhotoError('La photo d’identité est obligatoire.');
      return;
    }
    setPhotoError(undefined);
    setSubmitting(true);

    try {
      const body = new FormData();
      const { birthYear, ...rest } = form;
      // Le code vient toujours du lien, jamais d'un champ modifiable
      Object.entries(rest).forEach(([key, value]) =>
        body.append(key, key === 'code' ? code : value),
      );
      // Le backend attend toujours "birthDate" : on envoie l'année au 1er janvier
      body.append('birthDate', `${birthYear}-01-01`);
      body.append('photo', photo);

      await apiPublic('/public/members/submit', { method: 'POST', body });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
        // Si l'envoi a échoué parce que le lien vient d'être consommé (autre
        // onglet, double envoi...), on bascule sur l'écran « lien déjà utilisé ».
        // Les données saisies sont conservées dans tous les autres cas.
        try {
          const status = await fetchAccessStatus(code);
          if (status === 'USED') setAccess('used');
          else if (status === 'INVALID') setAccess('invalid');
        } catch {
          /* vérification impossible : on garde le formulaire et le message d'erreur */
        }
      } else {
        setSubmitError('Impossible d’envoyer le formulaire, vérifiez votre connexion.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- Écrans « message » ----------

  if (success) {
    return (
      <MessageCard>
        <StatusIcon icon={CheckCircle2} tone="green" />
        <h2 className={MESSAGE_TITLE}>Demande envoyée !</h2>
        <p className={MESSAGE_TEXT}>
          Nous avons bien reçu vos informations. Un e-mail de confirmation vous a été
          envoyé. Votre carte de membre vous parviendra par e-mail dès qu&apos;elle
          sera générée par l&apos;administrateur.
        </p>
        <Link href="/" className={MESSAGE_BUTTON}>
          Retour à l&apos;accueil
        </Link>
      </MessageCard>
    );
  }

  if (access === 'checking') {
    return (
      <MessageCard>
        <StatusIcon icon={Loader2} tone="blue" spin />
        <h2 className={MESSAGE_TITLE}>Vérification de votre lien…</h2>
        <p className={MESSAGE_TEXT}>
          {slowCheck
            ? 'Le serveur se réveille, cela peut prendre quelques secondes. Merci de patienter.'
            : 'Un instant, nous préparons votre formulaire.'}
        </p>
      </MessageCard>
    );
  }

  if (access === 'used') {
    return (
      <MessageCard>
        <StatusIcon icon={CheckCircle2} tone="amber" />
        <h2 className={MESSAGE_TITLE}>Ce lien a déjà été utilisé</h2>
        <p className={MESSAGE_TEXT}>
          Une demande d&apos;adhésion a déjà été envoyée avec ce lien : le formulaire ne
          peut plus être rempli. Si c&apos;est votre demande, vous recevrez votre carte de
          membre par e-mail. Pour toute question ou correction, contactez l&apos;association.
        </p>
        <Link href="/" className={MESSAGE_BUTTON}>
          Retour à l&apos;accueil
        </Link>
      </MessageCard>
    );
  }

  if (access === 'invalid') {
    return (
      <MessageCard>
        <StatusIcon icon={Ban} tone="red" />
        <h2 className={MESSAGE_TITLE}>Lien invalide</h2>
        <p className={MESSAGE_TEXT}>
          Ce lien n&apos;est pas reconnu. Utilisez le bouton « Remplir le formulaire » de
          l&apos;e-mail que vous avez reçu, ou contactez l&apos;association pour obtenir un
          nouveau lien.
        </p>
        <Link href="/" className={MESSAGE_BUTTON}>
          Retour à l&apos;accueil
        </Link>
      </MessageCard>
    );
  }

  if (access === 'missing') {
    return (
      <MessageCard>
        <StatusIcon icon={Mail} tone="blue" />
        <h2 className={MESSAGE_TITLE}>Accès par e-mail uniquement</h2>
        <p className={MESSAGE_TEXT}>
          Le formulaire s&apos;ouvre depuis le lien personnel que vous avez reçu par e-mail.
          Cliquez sur le bouton « Remplir le formulaire » de ce message. Pas de lien ?
          Contactez l&apos;association pour en recevoir un.
        </p>
        <Link href="/" className={MESSAGE_BUTTON}>
          Retour à l&apos;accueil
        </Link>
      </MessageCard>
    );
  }

  if (access === 'error') {
    return (
      <MessageCard>
        <StatusIcon icon={WifiOff} tone="amber" />
        <h2 className={MESSAGE_TITLE}>Vérification impossible</h2>
        <p className={MESSAGE_TEXT}>
          Nous n&apos;arrivons pas à joindre le serveur pour vérifier votre lien. Vérifiez
          votre connexion puis réessayez : votre lien reste valable.
        </p>
        <button
          type="button"
          onClick={() => setCheckAttempt((n) => n + 1)}
          className={MESSAGE_BUTTON}
        >
          Réessayer
        </button>
      </MessageCard>
    );
  }

  // ---------- Formulaire (lien valide) ----------

  return (
    <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-ocean-900/10 ring-1 ring-slate-900/5">
      <div className={GOLD_BAR} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-8 p-5 sm:gap-9 sm:p-9 md:p-11">
        {submitError && (
          <div
            ref={errorRef}
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Code d'accès : rempli automatiquement depuis le lien, non modifiable */}
        <section className="relative overflow-hidden rounded-2xl border border-[#D8B65C]/40 bg-gradient-to-br from-ocean-50 to-white p-4 pl-5 sm:p-5 sm:pl-6">
          <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#F3E2A9] to-[#9A7B2F]" />
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#D8B65C]/15 text-[#9A7B2F]">
              <Lock className="h-[18px] w-[18px]" />
            </span>
            <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-ocean-700">
              Code d&apos;accès
            </h2>
          </div>
          <Input
            label="Votre code d’accès"
            name="code"
            value={form.code}
            readOnly
            disabled
            className="font-semibold uppercase tracking-[0.2em]"
          />
          <p className="mt-2 text-xs text-ocean-500">
            Votre code a été renseigné automatiquement.
          </p>
        </section>

        {/* Informations personnelles */}
        <section className="flex flex-col gap-4">
          <SectionTitle icon={User}>Informations personnelles</SectionTitle>
          <div className={ROW_EQUAL}>
            <Input
              label="Prénom"
              name="firstName"
              autoComplete="given-name"
              required
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
            />
            <Input
              label="Nom"
              name="lastName"
              autoComplete="family-name"
              required
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
            />
          </div>
          <div className={ROW_EQUAL}>
            <Input
              label="Année de naissance"
              name="birthYear"
              type="text"
              inputMode="numeric"
              autoComplete="bday-year"
              pattern="[0-9]{4}"
              maxLength={4}
              placeholder="1990"
              required
              value={form.birthYear}
              onChange={(e) =>
                update('birthYear', e.target.value.replace(/\D/g, '').slice(0, 4))
              }
            />
            <Input
              label="Ville / district d'origine"
              name="originDistrict"
              required
              value={form.originDistrict}
              onChange={(e) => update('originDistrict', e.target.value)}
            />
          </div>
        </section>

        {/* Résidence */}
        <section className="flex flex-col gap-4">
          <SectionTitle icon={MapPin}>Résidence aux États-Unis</SectionTitle>
          <div className={ROW_WIDE_NARROW}>
            <Input
              label="Adresse"
              name="addressLine"
              autoComplete="street-address"
              required
              value={form.addressLine}
              onChange={(e) => update('addressLine', e.target.value)}
            />
            <Input
              label="État"
              name="state"
              autoComplete="address-level1"
              required
              value={form.state}
              onChange={(e) => update('state', e.target.value)}
            />
          </div>
          <div className={ROW_WIDE_NARROW}>
            <Input
              label="Ville"
              name="city"
              autoComplete="address-level2"
              required
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
            />
            <Input
              label="Code postal"
              name="zipCode"
              inputMode="numeric"
              autoComplete="postal-code"
              required
              value={form.zipCode}
              onChange={(e) => update('zipCode', e.target.value)}
            />
          </div>
        </section>

        {/* Contact */}
        <section className="flex flex-col gap-4">
          <SectionTitle icon={Phone}>Contact</SectionTitle>
          <div className={ROW_EQUAL}>
            <Input
              label="Téléphone portable"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
            <Input
              label="Adresse e-mail"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>
        </section>

        <section>
          <PhotoDropzone file={photo} onChange={setPhoto} error={photoError} />
        </section>

        <div className="flex flex-col gap-3">
          <Button type="submit" size="lg" loading={submitting} className="w-full">
            {submitting ? 'Envoi en cours...' : 'Envoyer ma demande'}
          </Button>
          <p className="text-center text-xs text-slate-500">
            Tous les champs sont obligatoires. Ce lien ne peut être utilisé qu&apos;une seule fois.
          </p>
        </div>
      </form>
    </div>
  );
}