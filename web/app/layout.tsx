//web/app/layout.tsx
// v1.4 — la suggestion d'installation (<InstallBanner />) est montée ici, dans le layout racine :
// elle apparaît dès la consultation du site (accueil, connexion…) et non plus seulement dans le tableau de bord.
// v1.3 — application installable (PWA) : couleur de la barre du téléphone, icônes, mode « appli »
// iPhone, et <InstallProvider /> (service worker + suggestion d'installation).
// v1.2 — clavier mobile (viewport + KeyboardAware) ; v1.1 — langue (FR/EN) : lue dans le cookie « lang » côté serveur, donc aucun
// clignotement au chargement ; <html lang> et métadonnées suivent la langue.
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ASSOCIATION_NAME } from '@/lib/constants';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { getT } from '@/lib/i18n/server';
import { KeyboardAware } from '@/components/layout/KeyboardAware';
import { InstallProvider } from '@/components/pwa/InstallProvider';
import { InstallBanner } from '@/components/pwa/InstallBanner';

// Clavier du téléphone : « resizes-content » réduit la page quand le clavier s'ouvre
// (au lieu de le laisser par-dessus et de cacher les champs). Sans effet sur Safari iOS,
// géré par <KeyboardAware />.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
  // Barre d'état du téléphone / de la fenêtre installée : même bleu que l'en-tête
  themeColor: '#082F47',
};

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: ASSOCIATION_NAME,
    description: t.common.associationTagline,
    applicationName: ASSOCIATION_NAME,
    icons: {
      icon: [
        { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    // iPhone : ouverture en plein écran (sans barre Safari) une fois ajoutée à l'écran d'accueil
    appleWebApp: {
      capable: true,
      title: 'Lelou',
      statusBarStyle: 'black',
    },
    formatDetection: { telephone: false },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getT();
  return (
    <html lang={locale}>
      <body className="font-sans antialiased">
        <I18nProvider locale={locale}>
          <InstallProvider>
            {children}
            <InstallBanner />
          </InstallProvider>
        </I18nProvider>
        <KeyboardAware />
      </body>
    </html>
  );
}
