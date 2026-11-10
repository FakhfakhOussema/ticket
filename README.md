# Pilotis Ticket

Application web de gestion de projets et de tickets (Kanban, liste, tableau de bord, membres et invitations par email, temps réel).
**Pilotis Ticket est une version de test, extraite de Pilotis ERP, où ce module sera intégré dans une version plus complète.**

- **Front** : Next.js 16 (App Router), TypeScript strict, Tailwind CSS v4, shadcn/ui, Recharts, `@dnd-kit`, React Hook Form + Zod
- **Back-end** : Supabase uniquement (Postgres + RLS, Auth, Realtime, Storage). Pas de serveur séparé.
- **Déploiement cible** : Vercel (plan Hobby). Tous les services utilisés ont une offre gratuite.

## Fonctionnalités

- Authentification email + mot de passe, mot de passe oublié, routes privées protégées par `proxy.ts`
- Projets (couleur, description), rôles `owner` / `admin` / `member`
- Invitations par email via Supabase Auth, acceptation avec création du mot de passe
- Tickets : Kanban (glisser-déposer), liste triable avec filtres et recherche, détail, commentaires, **temps réel**
- Tableau de bord par projet : KPI, répartition par assigné, statuts par membre, « Mes tâches », activité récente (agrégats calculés en SQL)
- « M'assigner » en un clic sur un ticket non assigné (Kanban, liste, détail)
- **Notes** par projet (menu du projet) : mémos colorés, épinglables, partagés avec l'équipe
- **Ma liste de tâches** (paramètres du compte et menu de l'avatar) : tickets assignés de tous les projets (couleur du projet) + tâches personnelles ou liées à un projet, strictement privées
- Logo de projet et images jointes aux tickets (Supabase Storage)
- Recherche globale (Ctrl/⌘ + K), mode clair/sombre, interface responsive, textes en français

## 1. Installation locale

Prérequis : Node.js 20+ et un compte [Supabase](https://supabase.com) (gratuit).

```bash
npm install
cp .env.example .env.local   # puis renseignez les 4 variables (voir ci-dessous)
npm run dev                  # http://localhost:3000
```

| Variable | Où la trouver | Remarque |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → General (`https://<ref>.supabase.co`) | publique |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API Keys → clé **publishable** (ou `anon`) | publique, protégée par la RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API Keys → clé **secret** (ou `service_role`) | **serveur uniquement**, jamais préfixée `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` en local, l'URL de production sur Vercel | sans slash final |

> La clé service role contourne la RLS. Elle n'est utilisée que dans `lib/supabase/admin.ts` (`import "server-only"`) pour l'envoi des invitations et l'upload d'avatar, après vérification de l'utilisateur. Ne la committez jamais (`.env.local` est ignoré par git).

## 2. Appliquer les migrations

Les migrations sont dans [`supabase/migrations/`](supabase/migrations/) et doivent être exécutées **dans l'ordre** :

| Fichier | Contenu |
|---|---|
| `…0001_schema.sql` | Types, tables, index, clés étrangères, triggers (`updated_at`, création du profil, owner = membre, position des tickets, assigné = membre) |
| `…0002_helpers.sql` | Fonctions `security definer` (`is_project_member`, `is_project_admin`, …) qui évitent la récursion dans les policies |
| `…0003_rls.sql` | RLS activée sur **toutes** les tables + droits par colonne |
| `…0004_rpc.sql` | RPC : `get_project_dashboard`, `accept_invitation`, `decline_invitation`, `get_invitation_by_token`, `my_pending_invitations` |
| `…0005_realtime.sql` | Tables ajoutées à la publication `supabase_realtime` |
| `…0006_notes_and_todos.sql` | Notes de projet (`project_notes`) et liste de tâches personnelle (`user_todos`), avec RLS |

**Option A — SQL Editor (le plus simple)** : ouvrez *SQL Editor* dans Supabase, collez et exécutez chaque fichier dans l'ordre.

**Option B — CLI Supabase** :
```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push
```

Régénérer les types TypeScript après une modification du schéma :
```bash
npm run db:types   # nécessite `supabase link`
```

### Règles de sécurité (RLS)

- Un utilisateur ne voit que les projets dont il est membre, ainsi que leurs tickets, commentaires et membres.
- Seuls `owner` / `admin` peuvent inviter et gérer les membres ; seul le `owner` modifie ou supprime le projet.
- Tout membre peut créer et modifier des tickets ; la suppression est réservée au créateur et aux `owner` / `admin`.
- L'assigné d'un ticket doit être membre du projet ; le `owner` ne peut être ni retiré ni rétrogradé.
- Notes : tout membre lit, crée et modifie ; suppression par l'auteur ou un `owner` / `admin`.
- Tâches personnelles (`user_todos`) : visibles et modifiables uniquement par leur propriétaire ; rattachement possible seulement à un projet dont on est membre.

## 3. Configuration de Supabase

### URL de redirection

*Authentication → URL Configuration* :

- **Site URL** : `http://localhost:3000` (puis l'URL de production une fois déployé)
- **Redirect URLs** : `http://localhost:3000/**` et `https://<votre-domaine>/**`

### Confirmation d'email

*Authentication → Providers → Email → Confirm email*. Activée : l'inscription demande de cliquer un lien reçu par email. Pour tester rapidement sans SMTP, vous pouvez la désactiver temporairement.

### Template d'email d'invitation (obligatoire)

Les invitations utilisent `inviteUserByEmail`, dont le lien par défaut renvoie les jetons dans le fragment d'URL (`#access_token=…`), illisible côté serveur. Remplacez le template pour passer par la route `/auth/confirm` de l'application.

*Authentication → Emails → Templates → **Invite user*** :

- **Subject** : `Vous êtes invité(e) à rejoindre un projet sur Pilotis Ticket`
- **Body** :

```html
<h2>Vous êtes invité(e) !</h2>
<p>Une personne vous a invité(e) à rejoindre un projet sur Pilotis Ticket.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next={{ .RedirectTo }}">Accepter l'invitation</a></p>
<p>Ce lien est valable 7 jours.</p>
```

`{{ .RedirectTo }}` vaut `<NEXT_PUBLIC_SITE_URL>/invitations/<token>` ; il doit correspondre à la **Site URL** (même origine) et figurer dans les *Redirect URLs*.

Les emails de **confirmation d'inscription** et de **réinitialisation de mot de passe** fonctionnent avec les templates par défaut (flux PKCE via `/auth/callback`). Vous pouvez simplement les traduire en français.

### Parcours d'invitation

| Invité | Ce qui se passe |
|---|---|
| Nouvel utilisateur | Email d'invitation → lien → page `/invitations/<token>` : bienvenue, nom + création du mot de passe, ajout au projet, redirection vers le projet |
| Compte déjà existant | Supabase Auth ne peut pas réinviter un compte existant : l'invitation est créée et apparaît dans **« Mes projets »** (bandeau Accepter / Refuser). L'administrateur peut aussi copier le lien d'invitation et l'envoyer lui-même. |

### SMTP Gmail

Le SMTP par défaut de Supabase est limité (quelques emails par heure, destiné aux tests). Pour un usage réel, configurez Gmail :

1. Sur le compte Google, activez la **validation en deux étapes**, puis créez un **mot de passe d'application** (Compte Google → Sécurité → Mots de passe des applications).
2. Dans Supabase : *Authentication → Emails → SMTP Settings* → activez *Custom SMTP* :
   - **Host** : `smtp.gmail.com` — **Port** : `465` (SSL) ou `587` (STARTTLS)
   - **Username** : votre adresse Gmail — **Password** : le mot de passe d'application (16 caractères)
   - **Sender email** : la même adresse Gmail (Gmail réécrit les autres expéditeurs) — **Sender name** : `Pilotis Ticket`
3. Envoyez-vous une invitation de test.

Limites : environ 500 emails par jour pour un compte Gmail gratuit. Pour plus de volume, utilisez un fournisseur transactionnel (Resend, Brevo…).

### Connexion avec Google

Le bouton « Continuer avec Google » est présent sur les pages de connexion et d'inscription (y compris quand on arrive depuis un lien d'invitation). Il ne fonctionne qu'une fois Google activé dans Supabase ; tant que ce n'est pas fait, un message l'indique.

1. **Google Cloud Console** → *APIs & Services → Credentials → Create credentials → OAuth client ID* (type **Web application**). Au préalable, configurez l'écran de consentement OAuth (*OAuth consent screen*, nom de l'application, email de support).
2. Dans **Authorized redirect URIs**, ajoutez l'URL de callback de Supabase :
   `https://<ref>.supabase.co/auth/v1/callback`
   (visible dans Supabase → *Authentication → Providers → Google*, champ « Callback URL »).
3. Copiez le **Client ID** et le **Client secret** générés.
4. Supabase → *Authentication → Providers → **Google*** : activez le fournisseur, collez le Client ID et le Client secret, enregistrez.
5. Vérifiez *Authentication → URL Configuration* : la **Site URL** et les **Redirect URLs** (`http://localhost:3000/**`, `https://<votre-domaine>/**`) doivent être renseignées.

Fonctionnement : le compte et son profil sont créés automatiquement à la première connexion (nom et photo repris de Google). Si une adresse email existe déjà, Supabase relie le compte Google au compte existant. Une invitation de projet s'accepte avec le compte Google correspondant à l'adresse invitée.

### Realtime et Storage

- **Realtime** : activé par la migration `…0005`. Aucun réglage supplémentaire.
- **Storage** : le bucket public `avatars` est créé automatiquement au premier envoi d'avatar (côté serveur, avec la clé service role). Les fichiers sont rangés par utilisateur (`avatars/<user_id>/…`), 2 Mo maximum, PNG / JPG / WebP / GIF.

## 4. Déploiement sur Vercel

1. Poussez le dépôt sur GitHub, puis *Add New → Project* sur [vercel.com](https://vercel.com) et importez-le (framework détecté : Next.js).
2. Dans *Settings → Environment Variables*, ajoutez les 4 variables de `.env.example` :
   `NEXT_PUBLIC_SITE_URL` = `https://<votre-projet>.vercel.app` (ou votre domaine), et marquez `SUPABASE_SERVICE_ROLE_KEY` comme sensible.
3. Déployez.
4. Dans Supabase → *URL Configuration* : mettez la **Site URL** et la **Redirect URL** `https://<votre-domaine>/**` sur l'URL de production.
5. Vérifiez : inscription, invitation par email, glisser-déposer, temps réel.

## 5. Structure du projet

```
app/                     routes (App Router)
  (auth)/                connexion, inscription, mot de passe, invitations/[token]
  (app)/                 espace connecté : projets, projets/[id]/{tickets,membres,parametres}, profil
  auth/{callback,confirm}/ retours des emails Supabase
components/              ui (shadcn), layout, projects, tickets, dashboard, members, auth, …
lib/supabase/            clients navigateur, serveur, admin (server-only), proxy de session, realtime
lib/actions/             Server Actions (auth, projets, tickets, membres, invitations, profil)
lib/queries/             lectures côté serveur
lib/validations/         schémas Zod
types/                   types de la base (Database) et types métier
supabase/migrations/     SQL : schéma, helpers, RLS, RPC, Realtime
proxy.ts                 protection des routes privées (middleware Next.js 16)
```

## 6. Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et exécution de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification TypeScript |
| `npm run db:types` | Régénère `types/database.ts` depuis le projet Supabase lié |

## Dépannage

- **« Variable d'environnement manquante »** : `.env.local` absent ou incomplet, redémarrez `npm run dev` après modification.
- **Lien d'email « invalide ou expiré »** : vérifiez la *Site URL* et les *Redirect URLs*, et le template *Invite user*.
- **Pas de mise à jour en temps réel** : la migration `…0005_realtime.sql` n'a pas été appliquée.
- **« Limite d'envoi d'emails atteinte »** : configurez le SMTP Gmail (section 3).
