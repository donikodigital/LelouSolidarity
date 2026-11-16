//web/lib/i18n/index.ts
import { type Locale } from './config';
import { common } from './dict/common';
import { home } from './dict/home';
import { forms } from './dict/forms';
import { verify } from './dict/verify';
import { admin } from './dict/admin';
import { notif } from './dict/notif';
import { install } from './dict/install';

export * from './config';
export { fmt } from './pair';

const dictionaries = {
  fr: {
    common: common.fr,
    home: home.fr,
    forms: forms.fr,
    verify: verify.fr,
    admin: admin.fr,
    notif: notif.fr,
    install: install.fr,
  },
  en: {
    common: common.en,
    home: home.en,
    forms: forms.en,
    verify: verify.en,
    admin: admin.en,
    notif: notif.en,
    install: install.en,
  },
  ff: {
    common: common.ff,
    home: home.ff,
    forms: forms.ff,
    verify: verify.ff,
    admin: admin.ff,
    notif: notif.ff,
    install: install.ff,
  },
};

export type Dictionary = typeof dictionaries.fr;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.fr;
}
