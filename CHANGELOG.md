# Changelog — TableNow Frontend

Format : entrées par date, avec le hash de commit. Les dates sont en heure UTC.

---

## Semaine du 4 au 10 juin 2026

Thèmes : **correction du build** (typecheck), **déploiement conteneurisé**, **onboarding piloté par le backend**, alignement de l'**écran de vérification d'e-mail** sur la maquette, et fiabilisation du **flux d'authentification** (course `onAuthStateChange`, garde single-flight).

### 10 juin 2026

- **`daa0be7` — fix(frontend) : le build typecheck enfin l'app + correction de 30 erreurs de types.**
  Le build lançait `tsc` contre le `tsconfig.json` racine (`files: []`) : il ne compilait donc rien, et Vite/esbuild ne typecheck pas → 30 vraies erreurs de types partaient en prod sans contrôle. Passage à `tsc -b` (project references) pour que les erreurs de types fassent échouer le build, et correction des 30 erreurs :
  - Dashboard : typer la réponse de `GET /dashboard/stats` (`StatsBuckets`) au lieu d'indexer un objet non typé.
  - GeneralSettings / ParrainageSettings : lire les champs restaurant depuis l'objet métier `restaurant` (source de vérité), et non depuis l'utilisateur d'auth Supabase (identité seulement) — c'était à la fois l'erreur de type et un bug latent.
  - ParrainageSettings : typer la liste de parrainage ; dériver le lien de partage de `window.location.origin` au lieu d'un `app.tablenow.io` codé en dur.

- **`5f36919` — build(docker) : image de déploiement frontend + nginx (portée depuis creezio).**
  `main` n'avait ni Dockerfile ni config nginx. Apport depuis la référence creezio, paramétré pour tablenow.io : build statique Vite servi par nginx, fallback SPA, HTML non caché, assets immuables en cache, proxy `/api` vers le conteneur backend, et CSP scopée sur `api.tablenow.io` + Supabase. Domaine/clés passés en build ARGs.

- **`3dcd67f` — feat(ui) : alignement de l'écran « vérifier l'e-mail » sur la maquette noir/vert.**
  L'écran post-inscription (Register, état « vérifiez votre e-mail ») reprend la maquette : enveloppe dans un anneau vert, « Un lien de vérification a été envoyé à <email> », bloc « UNE FOIS ACTIVÉ » (assistant IA / ligne dédiée / BCC privé), CTA principal « J'ai vérifié mon email → » qui relit la session Supabase et suit `next_route`, et un lien de renvoi. Reste basé sur Supabase (l'identité reste dans Supabase).

- **`5e1b295` — fix(ui) : enveloppe blanche dans l'écran de vérification d'e-mail** (conformité maquette).

- **`cad785b` — fix(auth) : ne pas vider l'app-state sur un 403 de la fenêtre de bootstrap.**
  À l'inscription d'un nouvel utilisateur, `onAuthStateChange` se déclenchait et appelait `/auth/app-state` avant que le bootstrap n'ait créé le restaurant → `403 NO_RESTAURANT`. Cela vidait `appState`/`restaurant`. Désormais, le 403 attendu est géré silencieusement : `runPostAuth` bootstrappe puis `refreshUser` remplit l'état.

- **`81c8420` — fix(auth) : suppression du contournement 403, correction de la course `onAuthStateChange`, garde single-flight.**
  `onAuthStateChange` n'appelle plus `fetchAppState` de façon indépendante (cause du `403 NO_RESTAURANT` avant bootstrap). L'absorption silencieuse du 403 est retirée. `postAuth` utilise une garde single-flight pour empêcher les appels concurrents de bootstrap.

### 8 juin 2026

- **`5773835` — Implement backend-driven onboarding flow with single routing truth.**
  - Nouvelle page **`Onboarding`** : parcours de première configuration guidé (identité + horaires + capacité). Réutilise `settingsAPI.update` (`PUT /settings`) et la forme `opening_hours` — aucun nouvel endpoint, aucune logique d'écriture dupliquée.
  - `App.tsx` : les guards consomment `appState.next_route` comme **unique décision métier**. `PrivateRoute`/`OnboardingRoute` s'appuient sur `next_route`, supprimant la logique de routage parallèle. `RootRedirect` suit `next_route` ou affiche `NotLinked` (jamais de rebond silencieux vers `/login` pour un utilisateur authentifié).
  - `Dashboard` : état contrôlé défensif pour un profil incomplet, plutôt qu'un dashboard vide présenté comme prêt.
  - `postAuth` : route vers `/` quand pas de `next_route` (`RootRedirect` arbitre), jamais vers `/login` pour une session authentifiée.
  _(Fusionné dans `main` via la PR #24.)_

### 4 juin 2026

- **`c0ac863` — feat(auth) : restauration d'une UX e-mail visible autour du flux d'auth Supabase.**
  Écrans explicites pour chaque étape e-mail, sans rollback de la migration Supabase (`/auth/bootstrap`, `/auth/app-state`, `runPostAuth` et le routage scopé par slug sont intacts) :
  - `emailResend.ts` : helpers de renvoi via les bonnes APIs Supabase (`auth.resend({ type: 'signup' })`, `resetPasswordForEmail`).
  - Register : carte « vérifiez votre e-mail » avec adresse, notice spam, bouton de renvoi (états chargement/erreur), retour connexion.
  - AuthCallback : états visibles distincts (vérification / confirmé / redirection / erreur) ; message explicite de lien invalide/expiré ; pas d'auto-redirection silencieuse.
  - ForgotPassword : écran de succès avec adresse, notice spam, renvoi, retour connexion.
  - Login : détecte le code explicite `email_not_confirmed` uniquement (garde `invalid_credentials` ambigu pour ne jamais révéler l'existence d'un compte) et propose un écran de renvoi de confirmation.

---

> Les évolutions antérieures (migration auth Google-only puis Supabase unifiée, routage canonique scopé par slug, gestion multi-calendriers + flux ICS, empilement des guards de fonctionnalité…) sont visibles dans l'historique Git (`git log`).
