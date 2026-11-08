//web/lib/i18n/server.ts
// Lecture de la langue côté serveur (composants serveur, métadonnées).
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LANG_COOKIE, isLocale, type Locale } from './config';
import { getDictionary } from './index';

export async function getLocale(): Promise<Locale> {
  const stored = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLocale(stored)) return stored;
  // Français par défaut : l'anglais n'apparaît que si la personne le choisit
  return DEFAULT_LOCALE;
}

export async function getT() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
