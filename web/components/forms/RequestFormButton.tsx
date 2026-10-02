//web/components/forms/RequestFormButton.tsx
'use client';

import { FormEvent, useState } from 'react';
import { AlertCircle, CheckCircle2, Mail, Send } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiPublic, ApiError } from '@/lib/api';

// Message type : il accompagne les informations du membre. Le même texte est
// enregistré côté serveur (le membre ne peut pas le modifier).
const REQUEST_MESSAGE =
  'Bonjour, je me permets de vous demander de m’envoyer mon formulaire d’adhésion de Lelou Solidarity afin que je puisse obtenir ma carte de membre. Vous trouverez mes informations personnelles ci-jointes.';

const ROW = 'grid grid-cols-2 items-end gap-3 [&>*]:min-w-0';

interface RequestState {
  firstName: string;
  lastName: string;
  city: string;
  phone: string;
  email: string;
  website: string; // champ piège anti-robots (toujours vide chez un humain)
}

const initialState: RequestState = {
  firstName: '',
  lastName: '',
  city: '',
  phone: '',
  email: '',
  website: '',
};

export function RequestFormButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RequestState>(initialState);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function update<K extends keyof RequestState>(key: K, value: RequestState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function close() {
    setOpen(false);
    // Après un envoi réussi, on repart d'un formulaire vide à la prochaine ouverture
    if (done) {
      setForm(initialState);
      setDone(false);
    }
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      await apiPublic('/public/form-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 429
            ? 'Trop de demandes envoyées depuis cet appareil. Merci de réessayer un peu plus tard.'
            : err.message,
        );
      } else {
        setError('Impossible d’envoyer votre demande, vérifiez votre connexion.');
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
        Demander votre formulaire d&apos;adhésion
      </button>

      <Modal
        open={open}
        onClose={close}
        size="lg"
        title={done ? undefined : 'Demander votre formulaire d’adhésion'}
      >
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-extrabold tracking-tight text-ocean-800">
              Demande envoyée !
            </h3>
            <p className="text-sm leading-relaxed text-ocean-500">
              L&apos;administrateur a bien reçu votre demande. Vous recevrez votre formulaire
              d&apos;adhésion par e-mail. Pensez à vérifier vos courriers indésirables.
            </p>
            <Button className="mt-2" onClick={close}>
              Fermer
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Message type qui accompagnera les informations */}
            <blockquote className="rounded-xl border-l-4 border-[#D8B65C] bg-ocean-50/70 px-4 py-3 text-sm leading-relaxed text-ocean-700">
              {REQUEST_MESSAGE}
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
                label="Prénom"
                name="firstName"
                autoComplete="given-name"
                required
                maxLength={80}
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
              />
              <Input
                label="Nom"
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
                label="Ville de résidence"
                name="city"
                autoComplete="address-level2"
                required
                maxLength={100}
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
              />
              <Input
                label="Téléphone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                maxLength={30}
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            </div>
            <Input
              label="Adresse e-mail"
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
                Ne pas remplir
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
              {sending ? 'Envoi en cours...' : 'Envoyer ma demande'}
            </Button>
            <p className="text-center text-xs text-slate-500">
              Tous les champs sont obligatoires.
            </p>
          </form>
        )}
      </Modal>
    </>
  );
}