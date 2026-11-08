//web/lib/i18n/config.ts
// Configuration des langues. Pour ajouter une langue :
// 1) l'ajouter à LOCALES + LOCALE_META, 2) ajouter sa clé dans lib/i18n/index.ts et
// son 3e bloc dans chaque fichier de lib/i18n/dict/*.ts (TypeScript signale ce qui manque).

export const LOCALES = ['fr', 'en', 'ff'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'fr';
export const LANG_COOKIE = 'lang';
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 an

export const LOCALE_META: Record<Locale, { label: string; short: string; intl: string }> = {
  fr: { label: 'Français', short: 'FR', intl: 'fr-FR' },
  en: { label: 'English', short: 'EN', intl: 'en-US' },
  // Pular (Fuuta Jallon) : code ISO « ff » (peul) pour le navigateur
  ff: { label: 'Pular', short: 'PU', intl: 'ff-Latn-GN' },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}
