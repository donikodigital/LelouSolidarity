//web/lib/i18n/client.ts
// Langue côté navigateur, utilisable hors composants React (api.ts, formatters).
import { LANG_COOKIE, LANG_COOKIE_MAX_AGE, DEFAULT_LOCALE, isLocale, type Locale } from './config';

export function readClientLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : '';
  if (isLocale(value)) return value;
  const htmlLang = document.documentElement.lang;
  return isLocale(htmlLang) ? htmlLang : DEFAULT_LOCALE;
}

/**
 * Remet la langue du navigateur sur la langue par défaut (français).
 * Appelé à la déconnexion : la langue appartient à la personne connectée, pas à l'appareil,
 * donc la suivante ne doit pas hériter de celle de la précédente.
 */
export function resetClientLocale() {
  if (typeof document === 'undefined') return;
  document.cookie = `${LANG_COOKIE}=${DEFAULT_LOCALE}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; SameSite=Lax`;
  document.documentElement.lang = DEFAULT_LOCALE;
}
