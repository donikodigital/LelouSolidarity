//web/components/admin/EditMemberModal.tsx
'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/components/admin/SessionProvider';
import { apiAdmin, ApiError } from '@/lib/api';
import { formatYear } from '@/lib/format';
import { Member } from '@/lib/types';

interface EditMemberModalProps {
  open: boolean;
  member: Member;
  onClose: () => void;
  /** cardOutdated = true si la carte existante contient des infos modifiees. */
  onSaved: (updated: Member, cardOutdated: boolean) => void;
}

interface EditForm {
  firstName: string;
  lastName: string;
  birthYear: string;
  originDistrict: string;
  addressLine: string;
  state: string;
  city: string;
  zipCode: string;
  phone: string;
  email: string;
}

const MIN_BIRTH_YEAR = 1900;

// Champs texte envoyes tels quels au backend (birthYear a un traitement propre)
const TEXT_FIELDS = [
  'firstName',
  'lastName',
  'originDistrict',
  'addressLine',
  'state',
  'city',
  'zipCode',
  'phone',
  'email',
] as const;

// Champs imprimes sur la carte PDF (voir card-template cote backend)
const CARD_FIELDS: (keyof EditForm)[] = [
  'firstName',
  'lastName',
  'birthYear',
  'originDistrict',
  'city',
  'state',
];

// Memes grilles que le formulaire public : 2 colonnes des le mobile
const ROW_EQUAL = 'grid grid-cols-2 items-end gap-3 sm:gap-4 [&>*]:min-w-0';
const ROW_WIDE_NARROW =
  'grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-end gap-3 sm:gap-4 [&>*]:min-w-0';

function fromMember(m: Member): EditForm {
  return {
    firstName: m.firstName,
    lastName: m.lastName,
    birthYear: formatYear(m.birthDate),
    originDistrict: m.originDistrict,
    addressLine: m.addressLine,
    state: m.state,
    city: m.city,
    zipCode: m.zipCode,
    phone: m.phone,
    email: m.email,
  };
}

export function EditMemberModal({ open, member, onClose, onSaved }: EditMemberModalProps) {
  const { session } = useSession();
  const initial = useMemo(() => fromMember(member), [member]);

  const [form, setForm] = useState<EditForm>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A chaque ouverture, on repart des valeurs actuelles du membre
  useEffect(() => {
    if (open) {
      setForm(initial);
      setError(null);
    }
  }, [open, initial]);

  const handleClose = useCallback(() => {
    if (!saving) onClose();
  }, [saving, onClose]);

  function update<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const currentYear = new Date().getFullYear();
    const year = Number(form.birthYear);
    if (
      !/^\d{4}$/.test(form.birthYear) ||
      year < MIN_BIRTH_YEAR ||
      year > currentYear
    ) {
      setError(
        `Annee de naissance invalide : indiquez 4 chiffres entre ${MIN_BIRTH_YEAR} et ${currentYear}.`,
      );
      return;
    }

    // On n'envoie que ce qui a change (PATCH)
    const payload: Record<string, string> = {};
    const changed = new Set<keyof EditForm>();

    for (const field of TEXT_FIELDS) {
      const value = form[field].trim();
      if (value !== initial[field]) {
        payload[field] = value;
        changed.add(field);
      }
    }
    // La date de naissance complete n'est ecrasee que si l'annee a change :
    // un membre ancien peut avoir une date precise qu'on ne veut pas perdre.
    if (form.birthYear !== initial.birthYear) {
      payload.birthDate = `${form.birthYear}-01-01`;
      changed.add('birthYear');
    }

    if (changed.size === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      const updated: Member = await apiAdmin(`/admin/members/${member.id}`, session.accessToken, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      const cardOutdated =
        Boolean(updated.memberCode) && CARD_FIELDS.some((field) => changed.has(field));
      onSaved(updated, cardOutdated);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Impossible d\u2019enregistrer les modifications, reessayez.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Modifier le membre" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className={ROW_EQUAL}>
          <Input
            label="Prenom"
            name="firstName"
            autoComplete="off"
            required
            value={form.firstName}
            onChange={(e) => update('firstName', e.target.value)}
          />
          <Input
            label="Nom"
            name="lastName"
            autoComplete="off"
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
            autoComplete="off"
            pattern="[0-9]{4}"
            maxLength={4}
            required
            value={form.birthYear}
            onChange={(e) => update('birthYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          <Input
            label="Ville / district d'origine"
            name="originDistrict"
            autoComplete="off"
            required
            value={form.originDistrict}
            onChange={(e) => update('originDistrict', e.target.value)}
          />
        </div>

        <div className={ROW_WIDE_NARROW}>
          <Input
            label="Adresse"
            name="addressLine"
            autoComplete="off"
            required
            value={form.addressLine}
            onChange={(e) => update('addressLine', e.target.value)}
          />
          <Input
            label="Etat"
            name="state"
            autoComplete="off"
            required
            value={form.state}
            onChange={(e) => update('state', e.target.value)}
          />
        </div>

        <div className={ROW_WIDE_NARROW}>
          <Input
            label="Ville"
            name="city"
            autoComplete="off"
            required
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
          />
          <Input
            label="Code postal"
            name="zipCode"
            inputMode="numeric"
            autoComplete="off"
            required
            value={form.zipCode}
            onChange={(e) => update('zipCode', e.target.value)}
          />
        </div>

        {/* Telephone / e-mail : empiles sur mobile dans la modale (largeur utile
            ~280 px, trop juste pour afficher une adresse e-mail en entier) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
          <Input
            label="Telephone portable"
            name="phone"
            type="tel"
            autoComplete="off"
            required
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
          <Input
            label="Adresse e-mail"
            name="email"
            type="email"
            autoComplete="off"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-1 grid grid-cols-2 gap-2.5 sm:flex sm:justify-end">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}