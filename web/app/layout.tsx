//web/app/layout.tsx
// v1.2 — clavier mobile (viewport + KeyboardAware) ; v1.1 — langue (FR/EN) : lue dans le cookie « lang » côté serveur, donc aucun
// clignotement au chargement ; <html lang> et métadonnées suivent la langue.
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ASSOCIATION_NAME } from '@/lib/constants';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { getT } from '@/lib/i18n/server';
import { KeyboardAware } from '@/components/layout/KeyboardAware';

// Clavier du téléphone : « resizes-content » réduit la page quand le clavier s'ouvre
// (au lieu de le laisser par-dessus et de cacher les champs). Sans effet sur Safari iOS,
// géré par <KeyboardAware />.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
};

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: ASSOCIATION_NAME,
    description: t.common.associationTagline,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getT();
  return (
    <html lang={locale}>
      <body className="font-sans antialiased">
        <I18nProvider locale={locale}>{children}</I18nProvider>
        <KeyboardAware />
      </body>
    </html>
  );
}
