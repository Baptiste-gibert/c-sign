# POC Payload CMS + Vite Frontend

Minimal proof-of-concept: **Payload 3.x** (backend + admin) + **Vite + React 19 + Tailwind + TanStack Query** (frontend SPA), running on Docker.

## Stack

| Layer      | Tech                                                     |
|------------|----------------------------------------------------------|
| Frontend   | Vite, React 19, TypeScript, Tailwind CSS, TanStack Query |
| Forms      | React Hook Form, Zod                                     |
| UI         | shadcn/ui (ready to install components)                  |
| Backend    | Payload 3.x, Next.js 15, Drizzle ORM                    |
| Database   | PostgreSQL 16                                            |
| Cache      | Redis 7                                                  |

## Quick Start

```bash
# 1. Start everything
docker compose up --build

# 2. Open in browser
#    Payload Admin:  http://localhost:3000/admin   (create first user)
#    Vite Frontend:  http://localhost:5173          (shows posts from API)

# 3. Create content
#    → Go to Payload admin, create a post
#    → Refresh Vite frontend, see it appear via TanStack Query
```

## Project Structure

```
poc-payload-vite/
├── .devcontainer/
│   └── devcontainer.json        # VS Code devcontainer config
├── docker-compose.yml           # PostgreSQL + Redis + Backend + Frontend
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.mjs
│   ├── tsconfig.json
│   ├── .env
│   └── src/
│       ├── payload.config.ts    # ← Payload config (collections, DB, auth)
│       ├── collections/
│       │   ├── Users.ts         # Users with auth + roles
│       │   ├── Posts.ts         # Example content collection
│       │   └── Media.ts        # File uploads
│       └── app/                 # Next.js app router (Payload admin + API)
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts           # Vite + proxy /api → Payload
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx             # Entry point
        ├── App.tsx              # TanStack Query provider + layout
        ├── index.css            # Tailwind import
        ├── lib/
        │   ├── api.ts           # Typed Payload API client
        │   └── utils.ts         # cn() helper for shadcn
        ├── hooks/
        │   └── use-posts.ts     # TanStack Query hooks
        └── components/
            ├── PostsList.tsx     # Example component consuming API
            └── ui/              # shadcn/ui components (add with npx shadcn add)
```

## How It Works

1. **Payload CMS** runs on `localhost:3000` — serves the admin UI and auto-generates REST API
2. **Vite** runs on `localhost:5173` — the React SPA that consumes the Payload API
3. **Vite proxy** forwards `/api/*` to Payload so the frontend can fetch data without CORS issues
4. **TanStack Query** handles caching, loading states, and revalidation automatically

## Adding shadcn/ui Components

```bash
cd frontend
npx shadcn@latest init     # first time setup
npx shadcn@latest add button card dialog table
```

## Adding a New Payload Collection

1. Create `backend/src/collections/YourCollection.ts`
2. Add it to `backend/src/payload.config.ts` → `collections` array
3. Restart backend — Payload auto-migrates the DB and generates the API
4. Create a hook in `frontend/src/hooks/` using TanStack Query
5. Build your UI component

## VS Code DevContainer

Open the project in VS Code, then **Reopen in Container** (requires Docker + Dev Containers extension). Everything starts automatically.

## Ports

| Port | Service           |
|------|-------------------|
| 3000 | Payload CMS       |
| 5173 | Vite Frontend     |
| 5432 | PostgreSQL        |
| 6379 | Redis             |
