//web/lib/format.ts
import { LOCALE_META, type Locale } from './i18n/config';

export function formatDate(value: string | null | undefined, locale: Locale = 'fr'): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat(LOCALE_META[locale].intl, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateShort(value: string | null | undefined, locale: Locale = 'fr'): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat(LOCALE_META[locale].intl, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

/**
 * Annee seule (ex. date de naissance). Lue en UTC : le formulaire public
 * envoie "AAAA-01-01" a minuit UTC, et une lecture en heure locale
 * afficherait l'annee precedente pour un navigateur situe a l'ouest de l'UTC.
 */
export function formatYear(value: string | null | undefined): string {
  if (!value) return '-';
  return String(new Date(value).getUTCFullYear());
}

export interface PhoneParts {
  /** true si le numéro est américain (10 chiffres, avec ou sans +1) */
  us: boolean;
  /** Numéro américain : « (718) 555-0123 » ; autre numéro : texte tel que saisi */
  national: string;
}

/** Même règle que le backend (common/phone.ts) : un numéro à 10 chiffres, ou 11 avec le 1, est américain. */
export function parsePhone(raw: string | null | undefined): PhoneParts {
  const value = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!value) return { us: false, national: '' };
  const international = value.startsWith('+') || value.startsWith('00');
  const digits = value.replace(/\D/g, '').slice(value.startsWith('00') ? 2 : 0);
  let national: string | null = null;
  if (digits.length === 10 && !international) national = digits;
  else if (digits.length === 11 && digits.startsWith('1')) national = digits.slice(1);
  return national
    ? { us: true, national: `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}` }
    : { us: false, national: value };
}

/** Affichage d'un numéro : « +1 (718) 555-0123 » pour un numéro américain. */
export function formatPhone(value: string | null | undefined): string {
  const { us, national } = parsePhone(value);
  if (!national) return '-';
  return us ? `+1 ${national}` : national;
}

/** Saisie d'un numéro américain (hors +1) : ne garde que 10 chiffres et les met en forme au fil de la frappe. */
export function formatUsPhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  // Numéro collé avec l'indicatif (« +1 718... ») : on retire le 1 initial
  if (digits.length > 10 && digits.startsWith('1')) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
