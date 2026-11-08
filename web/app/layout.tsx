//web/app/layout.tsx
// v1.1 — langue (FR/EN) : lue dans le cookie « lang » côté serveur, donc aucun
// clignotement au chargement ; <html lang> et métadonnées suivent la langue.
import type { Metadata } from 'next';
import './globals.css';
import { ASSOCIATION_NAME } from '@/lib/constants';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { getT } from '@/lib/i18n/server';

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
      </body>
    </html>
  );
}
