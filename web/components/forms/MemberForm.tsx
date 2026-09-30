//web/components/forms/MemberForm.tsx
'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhotoDropzone } from '@/components/ui/PhotoDropzone';
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

// Grilles de champs : 2 colonnes des le mobile, sur toutes les tailles d'ecran.
// - min-w-0 evite qu'un champ deborde de sa colonne sur petit ecran
// - items-end aligne les champs meme si un libelle passe sur 2 lignes
const ROW_EQUAL =
  'grid grid-cols-2 items-end gap-3 sm:gap-4 [&>*]:min-w-0';
const ROW_WIDE_NARROW =
  'grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-end gap-3 sm:gap-4 [&>*]:min-w-0';

const MIN_BIRTH_YEAR = 1900;

export function MemberForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Sur mobile, le message d'erreur est en haut du formulaire : on y ramene l'ecran
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
        `Annee de naissance invalide : indiquez 4 chiffres entre ${MIN_BIRTH_YEAR} et ${currentYear}.`,
      );
      return;
    }

    if (!photo) {
      setPhotoError("La photo d'identite est obligatoire.");
      return;
    }
    setPhotoError(undefined);
    setSubmitting(true);

    try {
      const body = new FormData();
      const { birthYear, ...rest } = form;
      Object.entries(rest).forEach(([key, value]) => body.append(key, value));
      // Le backend attend toujours "birthDate" : on envoie l'annee au 1er janvier
      body.append('birthDate', `${birthYear}-01-01`);
      body.append('photo', photo);

      await apiPublic('/public/members/submit', { method: 'POST', body });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Impossible d\u2019envoyer le formulaire, verifiez votre connexion.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Card className="mx-auto flex max-w-lg flex-col items-center gap-4 px-5 py-12 text-center sm:px-8 sm:py-14">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-ocean-800">Demande envoyee !</h2>
        <p className="text-sm leading-relaxed text-ocean-500">
          Nous avons bien recu vos informations. Un e-mail de confirmation vous a ete
          envoye. Votre carte de membre vous parviendra par e-mail des qu&apos;elle
          sera generee par l&apos;administrateur.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-2xl p-4 sm:p-8 md:p-10">
      <form onSubmit={handleSubmit} className="flex flex-col gap-7 sm:gap-8">
        {submitError && (
          <div
            ref={errorRef}
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <section className="rounded-xl bg-ocean-50/70 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2 text-ocean-700">
            <KeyRound className="h-4 w-4" />
            <h2 className="text-sm font-bold uppercase tracking-wide">Code d&apos;acces</h2>
          </div>
          <Input
            label="Code recu par e-mail"
            name="code"
            required
            value={form.code}
            onChange={(e) => update('code', e.target.value.toUpperCase())}
            placeholder="EX: 7KQ9PXWM"
            className="uppercase tracking-widest"
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ocean-400">
            Informations personnelles
          </h2>
          <div className={ROW_EQUAL}>
            <Input
              label="Prenom"
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
              label="Annee de naissance"
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

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ocean-400">
            Residence aux Etats-Unis
          </h2>
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
              label="Etat"
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

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ocean-400">Contact</h2>
          <div className={ROW_EQUAL}>
            <Input
              label="Telephone portable"
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

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          {submitting ? 'Envoi en cours...' : 'Envoyer ma demande'}
        </Button>
      </form>
    </Card>
  );
}