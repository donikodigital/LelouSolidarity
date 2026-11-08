//web/lib/i18n/client.ts
// Langue côté navigateur, utilisable hors composants React (api.ts, formatters).
import { LANG_COOKIE, DEFAULT_LOCALE, isLocale, type Locale } from './config';

export function readClientLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : '';
  if (isLocale(value)) return value;
  const htmlLang = document.documentElement.lang;
  return isLocale(htmlLang) ? htmlLang : DEFAULT_LOCALE;
}
