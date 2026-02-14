# c-sign — Feuille de Presence Digitale

## Projet

Application web de feuilles de presence digitales pour Ceva Sante Animale (departement Transparence & Market Intelligence). Remplace les feuilles papier pour les evenements (reunions, repas avec veterinaires). Voir `.claude/documentation/project-description.md` pour le cahier des charges complet.

## Architecture

Application Next.js 15 unifiee — Payload CMS + frontend React dans le meme projet. Tout le dev se fait depuis `/workspace`.

```
c-sign/
├── backend/                # Next.js 15 unifie (Payload CMS + frontend)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (payload)/  # Admin Payload CMS + API routes
│   │   │   └── (frontend)/ # Pages publiques et organisateur
│   │   ├── collections/    # Collections Payload (schema-as-code)
│   │   ├── components/     # Composants React (shadcn/ui + custom)
│   │   ├── hooks/          # TanStack Query hooks
│   │   ├── pages/          # Composants page (importes par app/ routes)
│   │   ├── lib/            # Utilitaires (schemas, navigation, api-fetch)
│   │   ├── config/         # Config (themes, status)
│   │   ├── contexts/       # React contexts (theme)
│   │   └── i18n/           # Traductions FR/EN
│   └── payload.config.ts
├── docker-compose.yml      # PostgreSQL + container de dev
├── Dockerfile.dev          # Image de dev (Node 22)
└── .devcontainer/          # Config VS Code
```

**Services :**
- `app` — container de dev unique (Next.js unifie)
- `postgres` — PostgreSQL 16 (seul service externe)

Pas de Redis, pas de containers separes. Le dev se fait entierement dans le container `app`.

## Commandes

```bash
# Demarrer l'app (Payload CMS + frontend)
cd /workspace/backend && npm run dev     # demarre sur :3000
```

## Variables d'environnement

Injectees via docker-compose.yml dans le container :
- `DATABASE_URI=postgresql://payload:payload_secret@postgres:5432/payload_poc`
- `PAYLOAD_SECRET=poc-super-secret-change-me-in-prod`
- `NODE_ENV=development`

Pour Vercel (auto-injectees) :
- `POSTGRES_URL` — Neon PostgreSQL (fallback si DATABASE_URI absent)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob Storage pour les medias
- `NEXT_PUBLIC_APP_URL` — URL publique (QR codes)

## Ports

| Port | Service                     |
|------|-----------------------------|
| 3000 | Next.js (Payload + Frontend)|
| 5432 | PostgreSQL                  |

## Outils globaux

- `claude` — Claude Code CLI (IA)
- `gsd` — Get Shit Done (meta-prompting et spec-driven development)

## Stack technique

- Payload CMS 3.x (config-as-code, REST API auto-generee)
- Next.js 15 App Router (runtime Payload + frontend)
- Drizzle ORM (adapter PostgreSQL)
- TypeScript strict
- React 19
- Tailwind CSS v4 + shadcn/ui (New York style)
- TanStack Query 5 (server state)
- React Hook Form + Zod (formulaires + validation)
- i18next (FR/EN, 3 namespaces: common, organizer, public)
- Lucide React (icones)
- Vercel Blob Storage (medias en production)

## Conventions

- TypeScript strict partout
- Prettier + ESLint (format on save)
- Collections Payload = schema-as-code dans `backend/src/collections/`
- Hooks TanStack Query dans `backend/src/hooks/`
- Composants shadcn/ui dans `backend/src/components/ui/`
- Pages dans `backend/src/pages/` (importees par les routes Next.js dans `app/(frontend)/`)
- Route groups: `(payload)` pour admin CMS, `(frontend)` pour l'app
- Les composants frontend utilisent `'use client'` (client components)
- Navigation via `@/lib/navigation` (compatibility layer Next.js)
- API calls via `@/lib/api-fetch` (centralized fetch avec gestion auth)

## Documentation detaillee

- `.claude/documentation/README.md` — guide rapide
- `.claude/documentation/project-description.md` — cahier des charges metier
- `.claude/documentation/stack-description.md` — architecture et patterns
