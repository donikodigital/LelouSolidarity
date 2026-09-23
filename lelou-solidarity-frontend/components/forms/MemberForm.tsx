'use client';

import { FormEvent, useState } from 'react';
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
  birthDate: string;
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
  birthDate: '',
  originDistrict: '',
  addressLine: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  email: '',
};

export function MemberForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!photo) {
      setPhotoError("La photo d'identite est obligatoire.");
      return;
    }
    setPhotoError(undefined);
    setSubmitting(true);

    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
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
      <Card className="mx-auto flex max-w-lg flex-col items-center gap-4 px-8 py-14 text-center">
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
    <Card className="mx-auto max-w-2xl p-6 sm:p-10">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {submitError && (
          <div className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <section className="rounded-xl bg-ocean-50/70 p-5">
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Prenom"
              name="firstName"
              required
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
            />
            <Input
              label="Nom"
              name="lastName"
              required
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
            />
          </div>
          <Input
            label="Date de naissance"
            name="birthDate"
            type="date"
            required
            value={form.birthDate}
            onChange={(e) => update('birthDate', e.target.value)}
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ocean-400">Origine</h2>
          <Input
            label="Ville / district d'origine a Lelouma"
            name="originDistrict"
            required
            value={form.originDistrict}
            onChange={(e) => update('originDistrict', e.target.value)}
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ocean-400">
            Residence aux Etats-Unis
          </h2>
          <Input
            label="Adresse"
            name="addressLine"
            required
            value={form.addressLine}
            onChange={(e) => update('addressLine', e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Ville"
              name="city"
              required
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
            />
            <Input
              label="Etat"
              name="state"
              required
              value={form.state}
              onChange={(e) => update('state', e.target.value)}
            />
            <Input
              label="Code postal"
              name="zipCode"
              required
              value={form.zipCode}
              onChange={(e) => update('zipCode', e.target.value)}
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ocean-400">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Telephone portable"
              name="phone"
              type="tel"
              required
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
            />
            <Input
              label="Adresse e-mail"
              name="email"
              type="email"
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
