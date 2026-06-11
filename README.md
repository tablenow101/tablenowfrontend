# TableNow — Frontend

TableNow est une plateforme de réservation couplée à une **hôtesse téléphonique IA** qui prend les appels 24/7 pour les restaurants. Le client appelle, l'agent IA répond en langage naturel, réserve la table, et la réservation apparaît instantanément dans le tableau de bord du restaurant.

Ce dépôt contient le **frontend** (React + TypeScript + Vite). Il sert deux surfaces :

- le site marketing sur `tablenow.io` (landing, inscription, connexion) ;
- l'application restaurant sur `app.tablenow.io` (tableau de bord, réservations, journal d'appels, réglages, onboarding).

L'agent vocal et l'API de réservation vivent dans le dépôt [`tablenowbackend`](https://github.com/tablenow101/tablenowbackend).

> 🆕 **Nouveautés de la semaine du 4 au 10 juin 2026** : voir [`CHANGELOG.md`](./CHANGELOG.md). Faits marquants : build qui **typecheck enfin** (série d'erreurs de types corrigées), image Docker + nginx, écran « vérifier l'e-mail » aligné sur la maquette, **onboarding piloté par le backend** (page `Onboarding` + guards qui consomment `next_route`), et correction de la course `onAuthStateChange` vs 403 `NO_RESTAURANT` (garde *single-flight*).

---

## Sommaire

1. [Stack technique](#1-stack-technique)
2. [Démarrage rapide](#2-démarrage-rapide)
3. [Structure du projet](#3-structure-du-projet)
4. [Routage & guards](#4-routage--guards)
5. [Flux d'authentification (piloté par le backend)](#5-flux-dauthentification-piloté-par-le-backend)
6. [Pages](#6-pages)
7. [Client API & librairie](#7-client-api--librairie)
8. [Variables d'environnement](#8-variables-denvironnement)
9. [Déploiement](#9-déploiement)
10. [Tests & autres docs](#10-tests--autres-docs)

---

## 1. Stack technique

| Domaine | Technologie |
| --- | --- |
| Framework UI | React 18 + TypeScript 5 |
| Build / dev | Vite 5 (dev port 5173, proxy `/api` → `localhost:5000`) |
| Routage | React Router 6 |
| Styles | Tailwind CSS 3 (dark mode, aucun fichier CSS séparé) |
| Auth | `@supabase/supabase-js` (flux **PKCE**, session persistée en `localStorage`) |
| Client HTTP | Axios (intercepteur d'en-tête `Authorization`) |
| i18n | i18next + `react-i18next` (FR par défaut, EN) — détection auto de langue |
| Icônes / police | `lucide-react` · `@fontsource/inter` |
| Tests | Vitest |

## 2. Démarrage rapide

Prérequis : Node 18+ et npm.

```bash
npm install
cp .env.example .env     # puis renseigner les valeurs (voir §8)
npm run dev              # serveur Vite avec HMR → http://localhost:5173
```

### Scripts npm

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de dev Vite avec HMR. |
| `npm run build` | **Typecheck (`tsc -b`) puis build** → `dist/`. Les erreurs de types font échouer le build. |
| `npm run preview` | Sert le build de production localement. |
| `npm run test` | Lance la suite Vitest. |
| `npm run lint` | ESLint (politique zéro warning). |

## 3. Structure du projet

```
src/
├── main.tsx            # Racine React + initialisation
├── App.tsx             # Définition des routes & guards (routage par domaine)
├── index.css           # Entrée Tailwind + styles globaux
├── pages/              # Vues de niveau route (Landing, Login, Dashboard, Bookings…)
│   └── settings/       # GeneralSettings, HoraireSettings, CalendarSettings, NotificationsSettings, ParrainageSettings
├── components/         # UI partagée
│   ├── Layout.tsx          # Chrome de l'app (navbar fixe, menu mobile, thème, langue)
│   ├── ErrorBoundary.tsx   # Capture les crashs de composants (fallback)
│   └── ChatWidget.tsx      # Concierge marketing : chatbot texte scripté (FAQ + démo Calendly + capture e-mail → POST /contact)
├── context/            # Providers React
│   ├── AuthProvider.tsx    # Session Supabase, restaurant, app-state
│   ├── LangProvider.tsx    # i18next (langue persistée)
│   └── SidebarProvider.tsx # État du menu mobile
├── hooks/              # useAuth · useLang · useSidebar
└── lib/                # Client API, client Supabase, helpers
    ├── api.ts              # Instance Axios + wrappers par domaine
    ├── supabase.ts         # Client Supabase (PKCE, session persistée)
    ├── postAuth.ts         # Routine post-auth unique (single-flight)
    ├── emailResend.ts      # Renvoi d'e-mails (confirmation / reset)
    └── __tests__/postAuth.test.ts
```

Le routage est **scindé par hôte** dans `src/App.tsx` : le domaine marketing n'expose que landing + auth, tandis que le domaine app expose le dashboard restaurant authentifié sous `/r/:restaurantSlug/*`.

## 4. Routage & guards

### Routes publiques

`/login` · `/register` · `/forgot-password` · `/reset-password` · `/logout` · `/auth/callback` (redirection OAuth + confirmation d'e-mail).

### Routes privées (scopées par slug)

| Route | Vue |
| --- | --- |
| `/r/:slug/dashboard` | `Dashboard` |
| `/r/:slug/reservations` | `Bookings` |
| `/r/:slug/calls` | `CallLogs` |
| `/r/:slug/settings` | `Settings` |
| `/r/:slug/billing` | `Billing` |
| `/r/:slug/onboarding` | `Onboarding` (sans `Layout`) |

Des **redirections héritées** (`/dashboard`, `/bookings`, `/settings`, `/setup`, `/onboarding`…) renvoient vers l'équivalent scopé par slug pour la rétrocompatibilité. La racine `/` et le catch-all `*` passent par `RootRedirect`.

### Composants de garde

| Garde | Vérifie | Redirection en échec |
| --- | --- | --- |
| **`PrivateRoute`** | `authReady` → session → restaurant lié → slug canonique → profil complet | spinner / `/login` / `NotLinked` / slug correct / `next_route` (onboarding) |
| **`OnboardingRoute`** | Idem mais **inverse** sur la complétude | suit `next_route` vers l'avant si déjà complet |
| **`CanonicalRedirect`** | Réécrit les chemins plats hérités en chemins scopés (slug = `restaurant.slug` uniquement) | `NotLinked` si pas de slug |
| **`RootRedirect`** | Point d'entrée `/` et chemins non mappés | suit `next_route` ; sinon `NotLinked` (jamais de boucle de login) |

> Le slug provient **uniquement** de `restaurant.slug` dans l'app-state, jamais reconstruit localement. La complétude du profil est décidée par le backend (`next_route`), jamais par le frontend.

## 5. Flux d'authentification (piloté par le backend)

L'auth est **agnostique au fournisseur** : e-mail/mot de passe et Google OAuth convergent vers une **routine post-auth unique**, `runPostAuth` (`lib/postAuth.ts`).

```
Connexion (Login/Register/AuthCallback)
        │  signInWithPassword | signInWithOAuth | exchange du code (PKCE)
        ▼
runPostAuth(refreshUser)            ← garde single-flight (un seul bootstrap concurrent)
        │  1. supabase.auth.getSession()  → access_token
        │  2. POST /auth/bootstrap(token) → crée/lie le restaurant (idempotent)
        │  3. refreshUser()               → GET /auth/app-state
        ▼
navigate(next_route)                ← suivi verbatim (jamais reconstruit)
        → /r/:slug/onboarding  (profil incomplet)
        → /r/:slug/dashboard   (profil complet)
```

### `AuthProvider` & la course du bootstrap

`onAuthStateChange` **n'appelle plus** `fetchAppState` de son côté : c'était la cause du `403 NO_RESTAURANT` quand un nouvel utilisateur se connectait avant que le bootstrap n'ait créé le restaurant. Désormais :

- **Nouvelle connexion** : `runPostAuth` (appelé par Login/Register/AuthCallback) enchaîne bootstrap → app-state → navigation.
- **Reconnexion** : `getSession()` au montage récupère l'app-state en toute sécurité (le bootstrap a déjà eu lieu).
- **Fenêtre de bootstrap** : un `403` attendu est absorbé silencieusement au lieu de vider l'app-state.
- **Single-flight** : `postAuth.ts` réutilise une seule promesse pour les appels concurrents (pas de double bootstrap, pas de double restaurant).

### Forme de l'app-state (`AppState`)

```ts
{
  user: { id, email },
  restaurant: { id, name, slug, status, is_complete, phone, email, ... } | null,
  subscription: { status: 'none' | 'trial' | 'active' | ... },  // ⚠️ contrat de type ; le backend renvoie aujourd'hui 'none' EN DUR
  calendar: { status: 'not_connected' | 'connected' | 'error', skipped? },
  provisioning: { status, phone_number? },
  onboarding: { status: 'not_started' | 'in_progress' | 'complete' },
  assistant: { status: 'inactive' | 'provisioning' | 'active' | 'error' },
  next_route: string | null   // ← SOURCE UNIQUE DE ROUTAGE
}
```

Les écrans d'e-mail (Register « vérifiez votre boîte mail », `AuthCallback`, `ForgotPassword`) exposent des états visibles explicites et des boutons de **renvoi** (`emailResend.ts`), sans rollback de la migration Supabase.

## 6. Pages

| Page | Contenu |
| --- | --- |
| `Landing` | Page marketing (hero + CTA). |
| `Login` / `Register` | E-mail/mot de passe + Google OAuth ; gestion de `email_not_confirmed` (renvoi de confirmation). |
| `AuthCallback` | Zone d'atterrissage post-auth (échange du code PKCE, lancement du bootstrap), états visibles (vérification / confirmé / redirection / erreur). |
| `ForgotPassword` / `ResetPassword` | Réinitialisation du mot de passe (écran de succès + renvoi ; mise à jour via session de récupération). |
| `Onboarding` | Formulaire de première configuration (nom, propriétaire, téléphone, adresse, capacité, horaires) → `PUT /settings` → suit `next_route`. La complétude est décidée par le backend. |
| `Dashboard` | KPIs (appels, réservations, couverts, conversion), insights (occupation, créneaux), tableaux appels récents / réservations à venir. État défensif si profil incomplet. |
| `Bookings` | Liste des réservations + tiroir de détail ; création / modification / annulation. |
| `CallLogs` | Historique d'appels + lecteur audio + téléchargement de transcription. |
| `Settings` | Onglets : Général · Horaires · Intégrations (Calendrier + Notifications) · Parrainage. |
| `Billing` | État de l'abonnement (lit `subscription.status` — actuellement toujours `'none'`, le backend ne l'exposant pas encore). |
| `NotLinked` | Repli quand l'utilisateur est authentifié sans restaurant lié. |

**Réglages** : `GeneralSettings` (infos restaurant — lues depuis l'objet métier `restaurant`, source de vérité, et non depuis l'utilisateur Supabase qui ne porte que l'identité), `HoraireSettings` (7 jours × services), `CalendarSettings` (OAuth Google + statut), `NotificationsSettings`, `ParrainageSettings` (code de parrainage, stats, lien de partage dérivé de `window.location.origin`).

## 7. Client API & librairie

- **`lib/api.ts`** — instance Axios (`baseURL = ${VITE_API_URL}/api`). L'intercepteur de requête lit le token Supabase **de façon synchrone** depuis `localStorage` et **n'appelle pas** `getSession()` (qui prend le verrou d'auth → risque de deadlock sur `/auth/callback`). Wrappers par domaine : `authAPI`, `dashboardAPI`, `bookingsAPI`, `settingsAPI`, `calendarAPI`, `emailAPI`, `referralAPI`.
- **`lib/supabase.ts`** — client Supabase (PKCE, `detectSessionInUrl`, `persistSession`, `autoRefreshToken`, stockage `localStorage`).
- **`lib/postAuth.ts`** — `runPostAuth` (garde single-flight ; renvoie `next_route` verbatim).
- **`lib/emailResend.ts`** — `resendSignupConfirmation` / `resendPasswordReset` (APIs Supabase correctes).

## 8. Variables d'environnement

Configurées via `.env` (voir [`.env.example`](./.env.example)) :

| Variable | Rôle |
| --- | --- |
| `VITE_API_URL` | URL de base de l'API backend (en prod : `https://api.tablenow.io`). |
| `VITE_SUPABASE_URL` | URL du projet Supabase. |
| `VITE_SUPABASE_ANON_KEY` | Clé publique Supabase. |

> ⚠️ Toute variable `VITE_*` est **incluse dans le bundle JavaScript** et visible dans le navigateur. À traiter comme publique : aucun vrai secret ne doit jamais être en `VITE_*` (les secrets vivent côté backend). Ne jamais committer `.env` ; en production, les secrets se définissent dans l'UI Vercel.

## 9. Déploiement

- **Vercel** (`vercel.json`) — surface principale. Push sur `main` → déploiement de production ; PR → preview. Réécritures : `/api/*` → backend, fallback SPA vers `/index.html`. En-têtes de sécurité (CSP, `nosniff`, `Referrer-Policy`).
- **Docker + nginx** (`Dockerfile`, `nginx.conf`) — alternative conteneurisée : build statique Vite servi par nginx, fallback SPA, HTML en `no-store`, assets immuables en cache 1 an, proxy `/api` vers le conteneur backend, CSP scopée sur `api.tablenow.io` + Supabase. Domaine/clés passés en **build ARGs**.

## 10. Tests & autres docs

- **`src/lib/__tests__/postAuth.test.ts`** (Vitest) — vérifie l'ordre bootstrap → app-state, la garde single-flight, la propagation des erreurs et la fidélité du routage (`next_route` jamais reconstruit).
- **[`TESTING_CHECKLIST.md`](./TESTING_CHECKLIST.md)** — checklist de tests manuels (Google OAuth, auto-liaison BDD, vérification e-mail, connexion/déconnexion calendrier, guards de route, scénarios d'erreur).
- **[`MOBILE_PARITY_CHECKLIST.md`](./MOBILE_PARITY_CHECKLIST.md)** & **[`MOBILE_PARITY_IMPLEMENTATION_PLAN.md`](./MOBILE_PARITY_IMPLEMENTATION_PLAN.md)** — parité mobile (chaque élément desktop visible/fonctionnel à 360px) et plan d'implémentation (cartes responsives pour les tableaux).

---

_Documentation mise à jour le 11 juin 2026. Pour le détail des évolutions récentes, voir [`CHANGELOG.md`](./CHANGELOG.md)._
