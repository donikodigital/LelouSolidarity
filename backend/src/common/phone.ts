//backend/src/common/phone.ts
// Numéros de téléphone : les membres résident aux États-Unis, leur numéro est
// donc présenté au format américain « +1 (718) 555-0123 » (drapeau des USA sur
// la carte). Un numéro étranger clairement identifié (+224 ..., +33 ...) est
// conservé tel quel et n'est jamais présenté avec le drapeau américain.

export interface ParsedPhone {
  /** true si le numéro est un numéro américain (10 chiffres, avec ou sans +1) */
  us: boolean;
  /** Texte à afficher/enregistrer : « +1 (718) 555-0123 » pour un numéro US, sinon le texte saisi nettoyé */
  text: string;
}

export function parsePhone(raw: string | null | undefined): ParsedPhone {
  const value = (raw ?? '').replace(/\s+/g, ' ').trim();
  if (!value) return { us: false, text: '' };

  const international = value.startsWith('+') || value.startsWith('00');
  // « 00 » est l'écriture européenne de « + » : on l'ignore pour compter les chiffres
  const digits = value.replace(/\D/g, '').slice(value.startsWith('00') ? 2 : 0);

  let national: string | null = null;
  if (digits.length === 10 && !international) national = digits;
  else if (digits.length === 11 && digits.startsWith('1')) national = digits.slice(1);

  if (national) {
    return {
      us: true,
      text: `+1 (${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`,
    };
  }
  return { us: false, text: value };
}

/** Forme enregistrée en base : numéro US normalisé, autres numéros inchangés. */
export function normalizePhone(raw: string | null | undefined): string {
  return parsePhone(raw).text;
}
