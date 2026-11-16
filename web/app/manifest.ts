//web/app/manifest.ts
// v1.1 — manifeste complété : captures d'écran (fenêtre d'installation « enrichie » d'Android et du
//        navigateur d'ordinateur), modes d'affichage de repli, application non remplaçable par une
//        application du Play Store.
// Manifeste de l'application installable (PWA). Next.js le publie sur /manifest.webmanifest
// et ajoute automatiquement la balise <link rel="manifest"> à toutes les pages.
// L'application installée s'ouvre sur l'espace administrateur (/admin) ; les raccourcis
// apparaissent en appuyant longuement sur l'icône (Android).
import type { MetadataRoute } from 'next';
import { ASSOCIATION_NAME } from '@/lib/constants';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/admin',
    name: `${ASSOCIATION_NAME} — Espace administrateur`,
    short_name: 'Lelou',
    description: 'Gestion des membres, des demandes et des cartes de membre de LELOU SOLIDARITY.',
    lang: 'fr',
    dir: 'ltr',
    start_url: '/admin',
    scope: '/',
    display: 'standalone',
    // Si « standalone » n'est pas disponible, on retombe sur une fenêtre minimale plutôt que sur un onglet
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait',
    background_color: '#082F47',
    theme_color: '#082F47',
    categories: ['business', 'productivity'],
    prefer_related_applications: false,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    screenshots: [
      {
        src: '/screenshots/mobile-accueil.png',
        sizes: '540x960',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Page d’accueil',
      },
      {
        src: '/screenshots/mobile-connexion.png',
        sizes: '540x960',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Connexion administrateur',
      },
      {
        src: '/screenshots/desktop-accueil.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Page d’accueil',
      },
    ],
    shortcuts: [
      { name: 'Demandes', url: '/admin/demandes', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Membres', url: '/admin/membres', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Codes d’accès', url: '/admin/codes', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
