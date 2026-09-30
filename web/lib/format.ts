//web/lib/format.ts
export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateShort(value: string | null | undefined): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
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