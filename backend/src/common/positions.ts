//backend/src/common/positions.ts
// v1.1 — + « Vice-président » ; le formulaire public propose aussi le poste.
// Postes proposés dans l'association. Un membre a un « code » (MEMBER, PRESIDENT...) ;
// pour « OTHER », le texte libre est dans positionOther (ex. « Conseiller »).
import { Locale } from './i18n';

export const POSITION_CODES = ['MEMBER', 'PRESIDENT', 'VICE_PRESIDENT', 'TREASURER', 'SECRETARY_GENERAL', 'OTHER'] as const;
export type PositionCode = (typeof POSITION_CODES)[number];

export const DEFAULT_POSITION: PositionCode = 'MEMBER';
export const MAX_POSITION_OTHER_LENGTH = 60;

const LABELS: Record<Locale, Record<Exclude<PositionCode, 'OTHER'>, string>> = {
  fr: { MEMBER: 'Membre', PRESIDENT: 'Président', VICE_PRESIDENT: 'Vice-président', TREASURER: 'Trésorier', SECRETARY_GENERAL: 'Secrétaire général' },
  en: { MEMBER: 'Member', PRESIDENT: 'President', VICE_PRESIDENT: 'Vice President', TREASURER: 'Treasurer', SECRETARY_GENERAL: 'General Secretary' },
  // Pular : en attendant une version relue par un locuteur, les intitulés restent en français
  ff: { MEMBER: 'Membre', PRESIDENT: 'Président', VICE_PRESIDENT: 'Vice-président', TREASURER: 'Trésorier', SECRETARY_GENERAL: 'Secrétaire général' },
};

export function isPositionCode(value: unknown): value is PositionCode {
  return typeof value === 'string' && (POSITION_CODES as readonly string[]).includes(value);
}

/** Intitulé du poste dans la langue demandée ; pour « OTHER », le texte saisi (ou « Membre » s'il est vide). */
export function positionLabel(position: string, other: string, locale: Locale): string {
  if (position === 'OTHER') return other.trim() || LABELS[locale].MEMBER;
  return isPositionCode(position) ? LABELS[locale][position as Exclude<PositionCode, 'OTHER'>] : LABELS[locale].MEMBER;
}
