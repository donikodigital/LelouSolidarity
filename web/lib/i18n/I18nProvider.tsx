//web/lib/i18n/I18nProvider.tsx
'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LANG_COOKIE,
  LANG_COOKIE_MAX_AGE,
  LOCALE_META,
  type Locale,
} from './config';
import { getDictionary, type Dictionary } from './index';

interface I18nContextValue {
  locale: Locale;
  t: Dictionary;
  /** Code de formatage Intl (ex. « fr-FR ») pour les dates. */
  intl: string;
  setLocale: (next: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale: initial,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initial);

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; SameSite=Lax`;
      document.documentElement.lang = next;
      setLocaleState(next);
      router.refresh();
    },
    [router],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, t: getDictionary(locale), intl: LOCALE_META[locale].intl, setLocale }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n doit être utilisé dans <I18nProvider>');
  return ctx;
}

/** Raccourci : le dictionnaire de la langue courante. */
export function useT(): Dictionary {
  return useI18n().t;
}
