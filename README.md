# PostFlow Pro

Application web pour planifier et publier du contenu sur Facebook, Instagram, TikTok, YouTube et X depuis une seule interface.

## Stack

- **Frontend** : Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend** : Supabase (Postgres, Auth, Storage, Edge Functions en Deno)
- **Hébergement** : Netlify

## Structure

```
src/                    Frontend React
supabase/migrations/    Schéma SQL (tables, RLS, bucket "media")
supabase/functions/     Edge Functions (OAuth, publication, planification)
public/                 Assets statiques (+ fichier de vérification TikTok)
netlify.toml            Build, proxy /media-proxy et fallback SPA
```

### Edge Functions

| Fonction | Rôle |
| --- | --- |
| `connect-facebook`, `connect-instagram`, `connect-tiktok`, `connect-youtube`, `connect-twitter` | Démarrent le flux OAuth de chaque plateforme |
| `oauth-callback` | Reçoit le retour OAuth et enregistre les tokens |
| `get-tiktok-creator-info` | Récupère les infos créateur TikTok avant publication |
| `publish-post` | Publie un post sur les plateformes choisies |
| `process-scheduled` | Publie les posts planifiés (à lancer par cron) |
| `refresh-tokens` | Rafraîchit les tokens expirés (à lancer par cron) |
| `retry-platform` | Relance une publication échouée |
| `disconnect-account` | Déconnecte un compte social |
| `delete-user` | Supprime le compte utilisateur et ses données |

## Développement local

Prérequis : Node.js 18+, npm, [Supabase CLI](https://supabase.com/docs/guides/cli).

```sh
npm install
cp .env.example .env   # renseigner l'URL et l'anon key Supabase
npm run dev
```

## Déploiement Supabase

```sh
supabase link --project-ref <project-ref>
supabase db push
cp supabase/functions/.env.example supabase/functions/.env   # renseigner les secrets
supabase secrets set --env-file supabase/functions/.env
supabase functions deploy
```

URL du site et redirections d'auth : définies dans `supabase/config.toml` (`[auth]`), appliquées avec `supabase config push` (relire le diff avant de valider chaque section).

### Cron

La migration `007_cron_jobs.sql` planifie via `pg_cron` :

- `process-scheduled` toutes les minutes (publication des posts programmés)
- `refresh-tokens` toutes les 6 heures

Ces deux fonctions n'acceptent que les appels portant l'en-tête `x-cron-secret`. Le secret est stocké hors git, à deux endroits avec la même valeur :

```sql
-- SQL Editor Supabase (une seule fois par projet)
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('<CRON_SECRET>', 'cron_secret');
```

et `CRON_SECRET` dans `supabase/functions/.env` (envoyé avec `supabase secrets set`).

Dans chaque console développeur (Meta, TikTok, Google, X), l'URL de redirection OAuth est :

```
https://<project-ref>.supabase.co/functions/v1/oauth-callback
```

## Déploiement Netlify

1. Relier le dépôt GitHub au site Netlify.
2. Définir `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans les variables d'environnement.
3. Dans `netlify.toml`, remplacer `SUPABASE_PROJECT_REF` par la ref du projet (proxy média requis par TikTok).

## Scripts

- `npm run dev` : serveur de développement
- `npm run build` : build de production
- `npm run preview` : prévisualiser le build
- `npm run lint` : ESLint
- `npm run test` : tests unitaires
