# PROJECT

## Vision

Build a proof-of-concept internal webapp using Payload CMS as the core backend (API + admin UI) and Vite + React as the frontend SPA. This POC validates the "One Stack, Multi-Repo" architecture for a 7,000-employee enterprise (120 IT staff) before scaling to production projects.

## Core Concept

A single Payload CMS instance serves as both the backend API and the admin panel. A separate Vite SPA consumes the Payload REST API to deliver the end-user experience. Both run in Docker containers alongside PostgreSQL and Redis. The goal is to prove that this stack can support internal business apps (Quickbase replacement), intranet tools, and public websites — all vibe-coded with AI assistance.

## Tech Stack

### Backend

- **Payload CMS 3.x** — config-as-code CMS + app framework (MIT license, $0)
- **Next.js 15** — Payload's runtime (serves admin UI + REST/GraphQL API)
- **TypeScript** — strict mode, everywhere
- **Drizzle ORM** — Payload's PostgreSQL adapter
- **PostgreSQL 16** — primary database
- **Redis 7** — cache, sessions

### Frontend

- **Vite 6** — build tool + dev server (SPA mode)
- **React 19** — UI library
- **TypeScript** — strict mode
- **Tailwind CSS 4** — utility-first styling
- **shadcn/ui** — component library (Radix UI + Tailwind, code you own)
- **TanStack Query 5** — server state management (cache, revalidation, mutations)
- **React Hook Form 7** — form management
- **Zod 3** — schema validation (shared between frontend and backend)
- **Lucide React** — icon library

### Infrastructure

- **Docker Compose** — 4 services: postgres, redis, backend, frontend
- **Node.js 22 LTS** — runtime

### NOT in POC scope (future production additions)

- Kong API Gateway
- Keycloak / OIDC authentication
- NestJS custom services
- Grafana / Prometheus observability
- Kubernetes / ArgoCD / Terraform
- React Native mobile app
- CI/CD pipelines

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Browser                                         │
│  ┌─────────────────┐    ┌─────────────────────┐ │
│  │ Vite SPA :5173  │    │ Payload Admin :3000  │ │
│  │ React + Tailwind│    │ /admin               │ │
│  │ TanStack Query  │    │ (built-in React UI)  │ │
│  └────────┬────────┘    └──────────┬──────────┘ │
└───────────┼─────────────────────────┼────────────┘
            │ fetch /api/*            │
            ▼                         ▼
┌─────────────────────────────────────────────────┐
│  Payload CMS (Next.js) :3000                     │
│  ├── REST API: /api/posts, /api/users, ...       │
│  ├── Auth: built-in (email/password for POC)     │
│  ├── Admin UI: /admin                            │
│  ├── Collections: Users, Posts, Media            │
│  └── Drizzle ORM → PostgreSQL                    │
└────────────┬──────────────┬──────────────────────┘
             │              │
     ┌───────▼──────┐  ┌───▼────┐
     │ PostgreSQL   │  │ Redis  │
     │ :5432        │  │ :6379  │
     └──────────────┘  └────────┘
```

## Project Structure

```
poc-payload-vite/
├── .devcontainer/devcontainer.json
├── docker-compose.yml
├── .planning/                    ← GSD planning files
│   ├── research/
│   ├── PROJECT.md (this file)
│   ├── REQUIREMENTS.md
│   ├── ROADMAP.md
│   └── STATE.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.mjs
│   ├── tsconfig.json
│   ├── .env
│   └── src/
│       ├── payload.config.ts     ← Main Payload config
│       ├── collections/          ← Schema-as-code
│       │   ├── Users.ts
│       │   ├── Posts.ts
│       │   └── Media.ts
│       └── app/                  ← Next.js app router
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx               ← TanStack Query provider
        ├── index.css             ← Tailwind
        ├── lib/
        │   ├── api.ts            ← Typed Payload API client
        │   └── utils.ts          ← cn() helper
        ├── hooks/
        │   └── use-posts.ts      ← TanStack Query hooks
        └── components/
            ├── PostsList.tsx      ← Example data component
            └── ui/               ← shadcn/ui components
```

## Key Patterns

### Schema-as-Code (Payload)

Collections are defined as TypeScript config files. Each collection auto-generates:

- REST API endpoints (`/api/{collection}`)
- Admin UI (list view, edit form, filters)
- TypeScript types
- Database migrations (Drizzle)

### Shared Zod Schemas

Validation schemas defined once with Zod, used:

1. In frontend (React Hook Form resolver)
2. In backend (Payload hooks / custom endpoints)

### TanStack Query Pattern

All API calls go through TanStack Query hooks:

- `useQuery` for reads (auto-caching, revalidation)
- `useMutation` for writes (optimistic updates, cache invalidation)
- Typed with Payload response types

### Vite Proxy

In dev, Vite proxies `/api/*` to `http://backend:3000` so the frontend can call Payload without CORS issues.

## Design Decisions

- **Payload auth for POC** — built-in email/password auth, no Keycloak (simplicity)
- **Separate frontend** — Vite SPA runs independently from Payload's Next.js, proving the decoupled pattern we'll use in production
- **4 Docker containers** — proper service isolation even in POC, matches production topology
- **shadcn/ui not pre-installed** — teams add components as needed (`npx shadcn add button card`)
- **No monorepo tooling** — simple folder structure, two package.json files, docker-compose handles orchestration

## Success Criteria

1. Docker Compose starts all 4 services with `docker compose up --build`
2. Payload admin is accessible at localhost:3000/admin
3. Frontend SPA loads at localhost:5173 and displays data from Payload API
4. Can create content in Payload admin → see it in Vite frontend via TanStack Query
5. Can add a new Payload collection (TypeScript config) → API auto-generated → frontend consumes it
6. Can add shadcn/ui components and build forms with React Hook Form + Zod
7. Hot reload works on both backend (Next.js) and frontend (Vite)
