# c-sign - Feuille de Presence Digitale

Digital attendance sheet application for **Ceva Sante Animale** (Transparency & Market Intelligence department). Replaces paper-based attendance sheets for events such as meetings, meals, and conferences with veterinarians.

## Overview

c-sign enables organizers to create events, generate QR codes for attendance days/sessions, and collect digital signatures from participants on their mobile devices. Once an event is finalized, an XLSX attendance report with embedded signatures is automatically generated and emailed to the designated recipients.

### Key Features

- **Event Management** - Create and manage events with multi-day/multi-session support
- **QR Code Attendance** - Generate QR codes per event, day, or session for easy check-in
- **Digital Signatures** - Capture participant signatures on any device via touch/stylus
- **XLSX Export** - Auto-generate attendance reports with embedded signature images
- **Email Delivery** - Automatic email with XLSX attachment on event finalization
- **Bilingual** - Full French/English interface with browser language detection
- **Themeable** - 4 built-in color themes + custom accent colors for public signing pages
- **Event Lifecycle** - Draft, Open, Finalized, Reopened status workflow
- **Walk-in Support** - Add participants on the fly during events
- **SIMV Integration** - Search veterinary professionals by registration number

## Architecture

Unified Next.js 15 application — Payload CMS backend + React frontend in a single project.

```
c-sign/
├── backend/                    # Next.js 15 unified app
│   ├── src/
│   │   ├── app/
│   │   │   ├── (payload)/      # Payload CMS admin + REST API
│   │   │   └── (frontend)/     # Public signing + organizer pages
│   │   ├── collections/        # Payload collections (7 schemas)
│   │   ├── components/         # React components (shadcn/ui + custom)
│   │   ├── views/              # Page-level view components
│   │   ├── hooks/              # TanStack Query hooks + Payload lifecycle hooks
│   │   ├── lib/                # Utilities, schemas, API client, export pipeline
│   │   ├── config/             # Themes, status configuration
│   │   ├── contexts/           # React contexts (ThemeProvider)
│   │   ├── i18n/               # Translations (FR/EN, 3 namespaces)
│   │   └── seed/               # Database seeding
│   └── payload.config.ts       # Payload CMS configuration
├── docker-compose.yml          # PostgreSQL + dev container
├── Dockerfile.dev              # Dev container image (Node 22)
└── .devcontainer/              # VS Code dev container config
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **CMS** | Payload CMS 3.x (config-as-code) |
| **Database** | PostgreSQL 16 (Drizzle ORM) |
| **Frontend** | React 19 + TypeScript |
| **Styling** | Tailwind CSS v4 + shadcn/ui (New York) |
| **State** | TanStack Query 5 |
| **Forms** | React Hook Form + Zod |
| **i18n** | i18next (FR/EN) |
| **Icons** | Lucide React |
| **Export** | ExcelJS (XLSX with embedded images) |
| **QR Codes** | qrcode.react + qrcode |
| **Signatures** | react-signature-canvas |
| **Email** | Nodemailer (via Payload adapter) |
| **Image Processing** | Sharp |

### Deployment

| Service | Provider |
|---------|----------|
| **Hosting** | Vercel (Hobby) |
| **Database** | Neon PostgreSQL |
| **Media Storage** | Vercel Blob |
| **Domain** | Vercel auto-assigned |

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 22+ (inside container)
- VS Code with Dev Containers extension (recommended)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Baptiste-gibert/c-sign.git
   cd c-sign
   ```

2. **Start with Dev Container** (recommended)
   - Open in VS Code
   - Click "Reopen in Container" when prompted
   - Dependencies install automatically

3. **Or start manually**
   ```bash
   docker compose up -d
   docker compose exec app bash
   cd backend && npm install
   ```

4. **Run the dev server**
   ```bash
   cd backend && npm run dev
   ```

5. **Access the app**
   - App: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

6. **Seed the database** (optional)
   ```bash
   curl http://localhost:3000/api/seed
   ```
   Default admin: `admin@test.com` / `admin123`

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URI` | Yes (local) | - | PostgreSQL connection string |
| `PAYLOAD_SECRET` | Yes | - | Payload CMS encryption secret |
| `NODE_ENV` | No | `development` | Environment mode |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Public URL for QR codes |
| `DATABASE_URL` | Yes (Vercel) | - | Neon PostgreSQL (auto-injected) |
| `POSTGRES_URL` | Alt | - | Alternative DB connection string |
| `BLOB_READ_WRITE_TOKEN` | No | - | Vercel Blob storage token |
| `SMTP_HOST` | No | - | SMTP server (email disabled without it) |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_USER` | No | - | SMTP authentication user |
| `SMTP_PASS` | No | - | SMTP authentication password |
| `SMTP_FROM_EMAIL` | No | `noreply@ceva.com` | Sender email address |

## Data Model

### Collections

| Collection | Purpose | Key Fields |
|-----------|---------|-----------|
| **Users** | Organizers & admins | email, role (admin/organizer), firstName, lastName |
| **Events** | Event definitions | title, location, status, theme, qrGranularity, expenseType, organizerName, cnovDeclarationNumber |
| **AttendanceDays** | Days within an event | date, event (rel), sessions (rel) |
| **Sessions** | Time slots within a day | name, startTime, endTime, attendanceDay (rel) |
| **Participants** | People attending | lastName, firstName, email, professionalNumber, beneficiaryType |
| **Signatures** | Digital signatures | participant (rel), session (rel), image (upload), rightToImage |
| **Media** | Uploaded files | Signature images (PNG/JPEG/WebP) |

### Event Status Lifecycle

```
Draft  ──>  Open  ──>  Finalized
                          │
                          v
                       Reopened  ──>  Finalized
```

- **Draft**: Event created, not yet open for signatures
- **Open**: QR codes active, participants can sign
- **Finalized**: Signatures closed, XLSX generated and emailed
- **Reopened**: Re-opened for additional signatures after finalization

### QR Code Granularity

| Mode | QR Codes Generated | Behavior |
|------|-------------------|----------|
| **Per Event** | 1 total | Single QR for the entire event |
| **Per Day** | 1 per day | Each day gets its own QR code |
| **Per Session** | 1 per session | Each session gets its own QR, auto-selects on scan |

## API Routes

### Payload REST API (auto-generated)

All collections are accessible via `/api/{collection-slug}` with standard CRUD operations:
- `GET /api/events` - List events
- `GET /api/events/:id` - Get event
- `POST /api/events` - Create event
- `PATCH /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- Same pattern for: `users`, `attendance-days`, `sessions`, `participants`, `signatures`, `media`

### Custom Routes

| Route | Method | Description |
|-------|--------|-------------|
| `GET /api/events/:id/export` | GET | Download XLSX attendance report (auth required) |
| `GET /api/qr-code?dayId=X` | GET | Generate QR code as data URL |
| `GET /api/seed` | GET | Seed database with demo data (dev only) |

## Frontend Routes

| Route | Auth | Description |
|-------|------|-------------|
| `/` | No | Landing page |
| `/login` | No | Login form |
| `/dashboard` | Yes | Event list and management |
| `/events/new` | Yes | Create new event |
| `/events/:id` | Yes | Event detail (tabs: attendance, participants, settings) |
| `/sign/:dayId` | No | Public signing page (QR code destination) |
| `/sign/:dayId?session=X` | No | Public signing with pre-selected session |
| `/success` | No | Post-signature confirmation |
| `/admin` | Yes | Payload CMS admin panel |

## Deployment to Vercel

### Initial Setup

1. **Connect GitHub repo** to Vercel
2. **Set Root Directory** to `backend` in Vercel project settings
3. **Connect Neon database** via Vercel Storage integration (auto-injects `DATABASE_URL`)
4. **Add environment variables**:
   - `PAYLOAD_SECRET` - Generate a secure random string
   - `NEXT_PUBLIC_APP_URL` - Your Vercel deployment URL
5. **Push schema** to Neon (first time only):
   ```bash
   cd backend
   DATABASE_URI="your-neon-connection-string" npm run dev
   # Wait for "Ready", then Ctrl+C
   ```
6. **Create Blob Store** (optional, for media uploads):
   - Vercel Dashboard > Storage > Create Blob Store
   - Auto-injects `BLOB_READ_WRITE_TOKEN`

### Subsequent Deploys

Auto-deploys on every push to `master`. Schema changes are auto-pushed via `push: true` in the Drizzle adapter.

## Project Structure Details

### Components

| Component | Description |
|-----------|-------------|
| `AttendanceDashboard` | Collapsible day cards with sessions, signatures, progress bars, QR codes |
| `EventForm` | Multi-step event creation with date picker, session editor, theme selector |
| `DaySessionEditor` | Configure attendance days with sessions (full day or custom slots) |
| `ParticipantForm` | Add participants with signature canvas and right-to-image consent |
| `ParticipantTable` | Sortable participant list with presence tracking |
| `ParticipantSearch` | SIMV professional search by registration number |
| `SignatureCanvas` | Touch-enabled signature drawing pad |
| `ThemeSelector` | Visual theme picker (4 palettes + custom color) |
| `StatusActionButton` | Inline 2-step confirmation for status transitions |
| `ProtectedRoute` | Auth guard with redirect to login |
| `PublicPageLayout` | Themed layout for public signing pages |
| `OrganizerLayout` | Sidebar navigation for organizer pages |

### Payload Hooks

| Hook | Trigger | Action |
|------|---------|--------|
| `events/afterChange` | Event create/update | Auto-creates AttendanceDays & Sessions from dates config |
| `events/afterFinalize` | Status changes to `finalized` | Generates XLSX + sends email with attachment |
| `events/afterRead` | Event read | Enriches event data |

### Theme System

4 built-in themes with WCAG AA contrast validation:
- **Tech Modern** (Blue accent)
- **Vibrant Purple** (Purple accent)
- **Nature Teal** (Teal accent)
- **Energy Orange** (Orange accent)

Custom accent colors supported with automatic dark-mode palette generation.

## Scripts

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Production build
npm run start        # Start production server
npm run payload      # Run Payload CLI commands
npm run generate:types  # Regenerate Payload TypeScript types
```

## License

Private - Ceva Sante Animale
