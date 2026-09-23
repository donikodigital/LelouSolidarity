# LELOU SOLIDARITY - Backend cartes de membre

Backend independant (NestJS + Prisma/PostgreSQL) pour la collecte des
informations des membres et la generation de cartes de membre au format
carte bancaire (CR80), avec QR code de verification et rappels
automatiques d'expiration.

## Fonctionnement general

1. L'administrateur genere un code d'acces pour un futur membre
   (`POST /api/admin/access-codes`) -> le code part par e-mail (Resend).
2. Le membre remplit le formulaire public avec ce code
   (`POST /api/public/members/submit`, multipart avec la photo) -> la
   demande arrive en attente cote administrateur, un e-mail de confirmation
   part au membre.
3. L'administrateur consulte les demandes (`GET /api/admin/members`) et
   declenche la generation de la carte d'un clic
   (`POST /api/admin/members/:id/card/generate`) -> PDF genere aux
   dimensions exactes d'une carte bancaire (85,6 x 53,98 mm), avec QR code,
   stocke sur Cloudinary, envoye par e-mail au membre.
4. Chaque jour, une tache planifiee verifie les cartes proches de
   l'expiration (rappel J-30 par defaut, configurable) et celles qui
   viennent d'expirer, et envoie les e-mails correspondants.
5. Le QR code de chaque carte pointe vers `{FRONTEND_URL}/verify/{token}`,
   qui devra appeler `GET /api/public/verify/:token` (statut toujours
   recalcule en direct, jamais fige).

Regenerer une carte deja ACTIVE = simple reimpression (les dates ne
changent pas). Regenerer une carte EXPIRING_SOON/EXPIRED = renouvellement
(nouvelle periode de validite d'un an a partir d'aujourd'hui).

## Stack technique

- **NestJS** (Node.js/TypeScript) - API REST prefixee `/api`
- **PostgreSQL** via **Prisma** (pense pour **Neon**)
- **Cloudinary** - stockage des photos et des PDF de carte
- **Resend** - envoi des e-mails transactionnels
- **Puppeteer** (`puppeteer-core` + `@sparticuz/chromium`) - rendu HTML/CSS
  vers PDF haute qualite, sans dependance systeme a installer sur Render
- **qrcode** - generation du QR code de chaque carte
- **JWT** (`@nestjs/jwt` + `passport-jwt`) - authentification de l'espace
  administrateur
- Prevu pour etre deploye sur **Render** (backend), le frontend a venir
  etant destine a **Vercel**

## Installation

```bash
npm install
cp .env.example .env
# remplir .env : DATABASE_URL (Neon), RESEND_API_KEY, MAIL_FROM,
# CLOUDINARY_*, JWT_SECRET, ADMIN_EMAIL/ADMIN_PASSWORD, FRONTEND_URL, ...

npx prisma migrate dev --name init   # cree les tables sur la base Neon
npx prisma db seed                   # cree le compte administrateur initial
```

## Lancer en local

```bash
npm run start:dev
```

L'API ecoute sur `http://localhost:4000/api` (port configurable via `PORT`).

**Puppeteer en local (Windows) :** `@sparticuz/chromium` cible un
environnement Linux (Render). Pour tester la generation de carte en local
sur Windows, installe Google Chrome normalement et ajoute dans `.env` :

```
PUPPETEER_EXECUTABLE_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

En production sur Render, ne pas definir cette variable : le code bascule
automatiquement sur `@sparticuz/chromium`.

## Deploiement sur Render

- **Build command** : `npm install && npm run build`
- **Start command** : `npm run start:prod`
- Renseigner toutes les variables de `.env.example` dans l'onglet
  Environment de Render (`DATABASE_URL` = URL Neon, `FRONTEND_URL` = URL
  Vercel du futur frontend, etc.)
- Apres le premier deploiement, lancer une fois
  `npx prisma migrate deploy` puis `npx prisma db seed` (via le Shell
  Render, ou en local avec `DATABASE_URL` pointee sur Neon).

## Vue d'ensemble des routes (prefixe `/api`)

| Methode | Route | Acces | Description |
|---|---|---|---|
| POST | `/auth/login` | public | Connexion administrateur (retourne un JWT) |
| POST | `/admin/access-codes` | admin | Genere et envoie un code d'acces a un e-mail |
| GET | `/admin/access-codes` | admin | Liste des codes generes |
| POST | `/public/members/submit` | code d'acces | Soumission du formulaire (multipart, champ `photo`) |
| GET | `/admin/members` | admin | Liste des membres (filtre `status`, `cardStatus`) |
| GET | `/admin/members/:id` | admin | Detail d'un membre |
| POST | `/admin/members/:id/card/generate` | admin | Genere/renouvelle/reimprime la carte |
| GET | `/admin/members/:id/card/download` | admin | Redirige vers le PDF de la carte |
| GET | `/public/verify/:token` | public | Statut d'une carte (utilise par la page du QR code) |

Les routes `admin/*` attendent un header `Authorization: Bearer <token>`
obtenu via `/auth/login`.

## Charte graphique (bleu ocean)

Toutes les couleurs sont centralisees dans `src/common/theme.ts`
(`primary`, `primaryDark`, ...). La teinte actuelle a ete extraite de la
capture envoyee. Une fois le logo et le domaine definitifs recus, il
suffit de mettre a jour ce fichier (et d'ajouter le vrai logo dans le
gabarit `src/cards/card-template.ts`, actuellement un badge "LS" de
remplacement) pour que la carte et tous les e-mails soient repercutes
automatiquement.

## Prochaine etape

Le frontend (formulaire public + espace administrateur, en React/Next.js,
moderne et responsive) consommera cette API. A construire dans un second
temps, comme convenu.
