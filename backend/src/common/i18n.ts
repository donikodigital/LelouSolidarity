//backend/src/common/i18n.ts
// Langue des réponses du serveur (messages d'erreur, e-mails, carte PDF).
// Le site web envoie la langue du visiteur dans l'en-tête « X-Lang » (fr | en | ff).
// Pour ajouter une langue : l'ajouter à LOCALES, puis compléter les gabarits
// d'e-mails (mail/templates.ts), la carte (cards/card-pdf.ts) et les messages
// (common/error-messages.ts) — TypeScript signale ce qui manque.
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const LOCALES = ['fr', 'en', 'ff'] as const; // ff = Pular (Fula)
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'fr';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Convertit une valeur quelconque (en-tête, base de données) en langue connue, « fr » par défaut. */
export function parseLocale(value: unknown): Locale {
  if (Array.isArray(value)) value = value[0];
  if (typeof value !== 'string') return DEFAULT_LOCALE;
  const code = value.trim().toLowerCase().slice(0, 2);
  return isLocale(code) ? code : DEFAULT_LOCALE;
}

/** Langue de la requête : en-tête X-Lang (envoyé par le site), sinon français. */
export function localeFromRequest(req: {
  headers?: Record<string, string | string[] | undefined>;
}): Locale {
  const headers = req?.headers ?? {};
  const explicit = headers['x-lang'];
  if (explicit) return parseLocale(explicit);
  return DEFAULT_LOCALE;
}

/** Décorateur de paramètre : @Lang() locale: Locale */
export const Lang = createParamDecorator((_data: unknown, ctx: ExecutionContext): Locale => {
  return localeFromRequest(ctx.switchToHttp().getRequest());
});

/** Code Intl pour formater les dates. */
export const INTL_LOCALE: Record<Locale, string> = { fr: 'fr-FR', en: 'en-US', ff: 'fr-FR' };

export function formatLongDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
