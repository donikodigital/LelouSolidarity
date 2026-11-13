//web/components/admin/EditMemberModal.tsx
// v1.4 — « Poste » : liste (Membre, Président, Trésorier, Secrétaire général, Autre) ; pour
// « Autre », l'intitulé est saisi librement. Le poste est imprimé sur la carte.
// v1.3 — textes FR/EN.
// v1.2 — « Ville de naissance » et « Pays » ; ville/localité d'origine et année/ville de
// naissance sur la même ligne (aucun de ces champs n'est imprimé sur la carte).
// v1.1 — champ « Localité d'origine » ; libellés alignés sur la carte (Ville d'origine,
// Ville de résidence) ; l'année de naissance n'est plus imprimée sur la carte, en
// revanche le téléphone et la localité le sont : ils rendent le PDF obsolète.
'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/components/admin/SessionProvider';
import { apiAdmin, ApiError } from '@/lib/api';
import { formatYear } from '@/lib/format';
import { Member } from '@/lib/types';
import { MAX_POSITION_OTHER_LENGTH, POSITION_CODES } from '@/lib/positions';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { fmt } from '@/lib/i18n/pair';

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
  birthCity: string;
  originDistrict: string;
  originLocality: string;
  position: string;
  positionOther: string;
  addressLine: string;
  state: string;
  country: string;
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
  'originLocality',
  'position',
  'positionOther',
  'birthCity',
  'addressLine',
  'state',
  'country',
  'city',
  'zipCode',
  'phone',
  'email',
] as const;

// Champs imprimes sur la carte PDF (voir card-pdf.ts cote backend)
const CARD_FIELDS: (keyof EditForm)[] = [
  'firstName',
  'lastName',
  'phone',
  'originDistrict',
  'originLocality',
  'position',
  'positionOther',
  'city',
  'state',
];

// Memes grilles que le formulaire public : 2 colonnes des le mobile
const ROW_EQUAL = 'grid grid-cols-2 items-end gap-3 sm:gap-4 [&>*]:min-w-0';

function fromMember(m: Member): EditForm {
  return {
    firstName: m.firstName,
    lastName: m.lastName,
    birthYear: formatYear(m.birthDate),
    birthCity: m.birthCity ?? '',
    originDistrict: m.originDistrict,
    originLocality: m.originLocality ?? '',
    position: m.position ?? 'MEMBER',
    positionOther: m.position === 'OTHER' ? m.positionOther ?? '' : '',
    addressLine: m.addressLine,
    state: m.state,
    country: m.country ?? '',
    city: m.city,
    zipCode: m.zipCode,
    phone: m.phone,
    email: m.email,
  };
}

export function EditMemberModal({ open, member, onClose, onSaved }: EditMemberModalProps) {
  const { session } = useSession();
  const { t } = useI18n();
  const te = t.admin.edit;
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
      setError(fmt(te.birthYearInvalid, { min: MIN_BIRTH_YEAR, max: currentYear }));
      return;
    }

    // On n'envoie que ce qui a change (PATCH)
    const payload: Record<string, string> = {};
    const changed = new Set<keyof EditForm>();

    // Poste : le texte libre n'existe que pour « Autre » et doit alors être renseigné
    const values: EditForm = {
      ...form,
      positionOther: form.position === 'OTHER' ? form.positionOther.trim().replace(/\s+/g, ' ') : '',
    };
    if (values.position === 'OTHER' && !values.positionOther) {
      setError(te.positionOtherRequired);
      return;
    }

    for (const field of TEXT_FIELDS) {
      const value = values[field].trim();
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
      setError(err instanceof ApiError ? err.message : te.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={te.title} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className={ROW_EQUAL}>
          <Input
            label={te.firstName}
            name="firstName"
            autoComplete="off"
            required
            value={form.firstName}
            onChange={(e) => update('firstName', e.target.value)}
          />
          <Input
            label={te.lastName}
            name="lastName"
            autoComplete="off"
            required
            value={form.lastName}
            onChange={(e) => update('lastName', e.target.value)}
          />
        </div>

        <div className={ROW_EQUAL}>
          <Input
            label={te.birthYear}
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
          {/* Pas « required » : les membres inscrits avant l'ajout du champ n'ont pas de ville
              de naissance, ça ne doit pas empêcher de modifier le reste de leur fiche. */}
          <Input
            label={te.birthCity}
            name="birthCity"
            autoComplete="off"
            placeholder="Lelouma"
            value={form.birthCity}
            onChange={(e) => update('birthCity', e.target.value)}
          />
        </div>

        <div className={ROW_EQUAL}>
          <Input
            label={te.originCity}
            name="originDistrict"
            autoComplete="off"
            placeholder="Lelouma"
            required
            value={form.originDistrict}
            onChange={(e) => update('originDistrict', e.target.value)}
          />
          <Input
            label={te.originLocality}
            name="originLocality"
            autoComplete="off"
            placeholder="Korbe"
            required
            value={form.originLocality}
            onChange={(e) => update('originLocality', e.target.value)}
          />
        </div>

        {/* Poste : liste + saisie libre pour « Autre » (imprimé sur la carte) */}
        <div className={ROW_EQUAL}>
          <div className={form.position === 'OTHER' ? undefined : 'col-span-2'}>
            <Select
              label={te.position}
              name="position"
              value={form.position}
              onChange={(e) => update('position', e.target.value)}
            >
              {POSITION_CODES.map((code) => (
                <option key={code} value={code}>
                  {t.admin.positions[code]}
                </option>
              ))}
            </Select>
          </div>
          {form.position === 'OTHER' && (
            <Input
              label={te.positionOther}
              name="positionOther"
              autoComplete="off"
              placeholder={te.positionOtherPlaceholder}
              maxLength={MAX_POSITION_OTHER_LENGTH}
              required
              value={form.positionOther}
              onChange={(e) => update('positionOther', e.target.value)}
            />
          )}
        </div>

        <Input
          label={te.address}
          name="addressLine"
          autoComplete="off"
          required
          value={form.addressLine}
          onChange={(e) => update('addressLine', e.target.value)}
        />

        <div className={ROW_EQUAL}>
          <Input
            label={te.residenceCity}
            name="city"
            autoComplete="off"
            required
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
          />
          <Input
            label={te.state}
            name="state"
            autoComplete="off"
            required
            value={form.state}
            onChange={(e) => update('state', e.target.value)}
          />
        </div>

        <div className={ROW_EQUAL}>
          <Input
            label={te.zipCode}
            name="zipCode"
            inputMode="numeric"
            autoComplete="off"
            required
            value={form.zipCode}
            onChange={(e) => update('zipCode', e.target.value)}
          />
          <Input
            label={te.country}
            name="country"
            autoComplete="off"
            required
            value={form.country}
            onChange={(e) => update('country', e.target.value)}
          />
        </div>

        {/* Telephone / e-mail : empiles sur mobile dans la modale (largeur utile
            ~280 px, trop juste pour afficher une adresse e-mail en entier) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
          <Input
            label={te.phone}
            name="phone"
            type="tel"
            placeholder="+1 (718) 555-0123"
            autoComplete="off"
            required
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
          <Input
            label={te.email}
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
            {te.cancel}
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? te.saving : te.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
}