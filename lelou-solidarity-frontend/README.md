# LELOU SOLIDARITY - Frontend

Frontend Next.js (App Router, TypeScript, Tailwind CSS) pour le systeme de
cartes de membre. Consomme l'API du backend NestJS (voir le zip
`lelou-solidarity-backend`).

## Pages

| Route | Description |
|---|---|
| `/` | Page d'accueil publique (presentation + CTA) |
| `/formulaire` | Formulaire public d'adhesion (code d'acces + infos + photo) |
| `/verify/[token]` | Page ouverte par le QR code d'une carte : statut en direct |
| `/admin/login` | Connexion de l'administrateur |
| `/admin` | Tableau de bord (statistiques, demandes en attente) |
| `/admin/membres` | Liste des membres, filtrable par statut (cartes, pas de tableau) |
| `/admin/membres/[id]` | Detail d'un membre + generation/renouvellement de la carte |
| `/admin/codes` | Envoi des codes d'acces + historique |

## Design

- Palette "bleu ocean" (`tailwind.config.ts`, namespace `ocean-50` a
  `ocean-900`), coherente avec la couleur utilisee sur la carte PDF cote
  backend.
- Back-office admin construit exclusivement avec des cartes ombrees
  (`shadow-card`), jamais de tableaux HTML, conformement a la charte
  demandee.
- Entierement responsive : navigation admin en menu lateral sur desktop,
  en tiroir (drawer) sur mobile ; formulaire et grilles de cartes en une
  colonne sur mobile, plusieurs colonnes au-dela.
- Polices systeme (pas de dependance a Google Fonts au build), pour un
  deploiement fiable en toutes circonstances.

## Authentification admin

Simple et adaptee a un usage interne : apres connexion
(`POST /auth/login`), le token JWT et les infos de l'admin sont stockes
dans le `localStorage` du navigateur (voir `lib/auth.ts`) et rejoues sur
chaque appel admin (`lib/api.ts::apiAdmin`). `SessionProvider`
(`components/admin/SessionProvider.tsx`) protege toutes les pages sous
`/admin/(dashboard)` et redirige vers `/admin/login` si absent.

## Installation

```bash
npm install
cp .env.local.example .env.local
# renseigner NEXT_PUBLIC_API_URL avec l'URL du backend (ex: http://localhost:4000/api
# en local, ou l'URL Render en production)
npm run dev
```

L'app tourne alors sur `http://localhost:3000`.

## Deploiement sur Vercel

- Importer ce repo dans Vercel.
- Renseigner la variable d'environnement `NEXT_PUBLIC_API_URL` avec l'URL
  publique du backend Render (ex. `https://lelou-solidarity-api.onrender.com/api`).
- Build/Start : detectes automatiquement par Vercel pour un projet
  Next.js, rien a configurer de plus.
- Une fois deploye, renseigner cette meme URL Vercel comme `FRONTEND_URL`
  cote backend (elle sert a construire le lien encode dans le QR code de
  chaque carte, `/verify/[token]`).

## A ajuster plus tard

- Logo officiel : remplacer le badge "LS" dans
  `components/layout/BrandMark.tsx` par le vrai logo une fois recu.
- Nom de domaine personnalise a brancher sur Vercel quand il sera choisi.
