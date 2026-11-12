//backend/src/admin-profile/members-csv.ts
// Export de la liste des membres au format CSV (ouvrable dans Excel, Numbers, Google Sheets).
// - BOM UTF-8 : Excel affiche correctement les accents.
// - Séparateur « ; » en français (Excel français), « , » sinon.
// - Protection contre l'injection de formules : une cellule qui commence par = @ (ou + / -
//   suivis de texte) pourrait être exécutée par le tableur ; on la préfixe d'une apostrophe.
//   Les numéros de téléphone (« +1 (718) 555-0123 ») restent intacts.
import { Locale } from '../common/i18n';

export interface CsvMember {
  memberCode: string | null;
  firstName: string;
  lastName: string;
  birthDate: Date;
  birthCity: string;
  originDistrict: string;
  originLocality: string;
  addressLine: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  locale: string;
  status: string;
  cardStatus: string;
  cardIssuedAt: Date | null;
  cardExpiresAt: Date | null;
  createdAt: Date;
}

const HEADERS: Record<'fr' | 'en', string[]> = {
  fr: [
    'Identifiant', 'Prénom', 'Nom', 'Année de naissance', 'Ville de naissance',
    'Ville d’origine', 'Localité d’origine', 'Adresse', 'Ville de résidence', 'État',
    'Code postal', 'Pays', 'Téléphone', 'E-mail', 'Langue', 'Statut', 'Statut de la carte',
    'Carte émise le', 'Carte expire le', 'Inscrit le',
  ],
  en: [
    'Member ID', 'First name', 'Last name', 'Year of birth', 'City of birth',
    'City of origin', 'Locality of origin', 'Address', 'City of residence', 'State',
    'ZIP code', 'Country', 'Phone', 'E-mail', 'Language', 'Status', 'Card status',
    'Card issued on', 'Card expires on', 'Registered on',
  ],
};

const STATUS: Record<'fr' | 'en', Record<string, string>> = {
  fr: { PENDING: 'En attente', VALIDATED: 'Validé' },
  en: { PENDING: 'Pending', VALIDATED: 'Validated' },
};

const CARD_STATUS: Record<'fr' | 'en', Record<string, string>> = {
  fr: { NONE: 'Aucune carte', ACTIVE: 'Active', EXPIRING_SOON: 'À renouveler', EXPIRED: 'Expirée' },
  en: { NONE: 'No card', ACTIVE: 'Active', EXPIRING_SOON: 'To renew', EXPIRED: 'Expired' },
};

const LANGUAGE: Record<'fr' | 'en', Record<string, string>> = {
  fr: { fr: 'Français', en: 'Anglais', ff: 'Pular' },
  en: { fr: 'French', en: 'English', ff: 'Pular' },
};

/** Date au format AAAA-MM-JJ (lue en UTC), vide si absente. */
function day(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : '';
}

/** Cellule CSV : neutralise les formules, entoure de guillemets si nécessaire. */
export function csvCell(value: string, separator: string): string {
  let text = value;
  const phoneLike = /^[+-][\d\s().-]+$/.test(text);
  if (/^[=@\t\r]/.test(text) || (/^[+-]/.test(text) && !phoneLike)) {
    text = `'${text}`;
  }
  if (text.includes('"') || text.includes(separator) || /[\r\n]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildMembersCsv(members: CsvMember[], locale: Locale): string {
  const lang: 'fr' | 'en' = locale === 'en' ? 'en' : 'fr';
  const separator = lang === 'fr' ? ';' : ',';

  const rows: string[][] = [HEADERS[lang]];
  for (const m of members) {
    rows.push([
      m.memberCode ?? '',
      m.firstName,
      m.lastName,
      String(m.birthDate.getUTCFullYear()),
      m.birthCity,
      m.originDistrict,
      m.originLocality,
      m.addressLine,
      m.city,
      m.state,
      m.zipCode,
      m.country,
      m.phone,
      m.email,
      LANGUAGE[lang][m.locale] ?? m.locale,
      STATUS[lang][m.status] ?? m.status,
      CARD_STATUS[lang][m.cardStatus] ?? m.cardStatus,
      day(m.cardIssuedAt),
      day(m.cardExpiresAt),
      day(m.createdAt),
    ]);
  }

  const body = rows.map((row) => row.map((cell) => csvCell(cell, separator)).join(separator)).join('\r\n');
  return `﻿${body}\r\n`;
}
