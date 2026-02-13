# Architecture Research

**Domain:** Digital Attendance Sheet / Event Signature Management
**Researched:** 2026-02-13
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PUBLIC LAYER (No Auth)                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  QR Code Scan    │  │  Participant     │  │   Signature      │   │
│  │  (Link to Event) │─▶│  Sign Form       │─▶│   Canvas         │   │
│  └──────────────────┘  └──────────────────┘  └─────────┬────────┘   │
│                                                          │            │
├──────────────────────────────────────────────────────────┼────────────┤
│                   AUTHENTICATED LAYER (Payload Auth)     │            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ │            │
│  │  Event Mgmt  │  │  Participant │  │  Finalization  │ │            │
│  │  (Create,    │─▶│  Pre-Populate│─▶│  (Export XLSX) │ │            │
│  │   Edit)      │  │  from SIMV)  │  │                │ │            │
│  └──────────────┘  └──────────────┘  └────────────────┘ │            │
├──────────────────────────────────────────────────────────┼────────────┤
│                        PAYLOAD CMS LAYER                 │            │
│  ┌──────────────────────────────────────────────────────┐│            │
│  │  REST API: /api/events, /api/attendance-days,        ││            │
│  │            /api/participants, /api/signatures        ││            │
│  │  Admin UI: /admin (Organizers only)                  ││            │
│  │  Auth: Built-in email/password                       ││            │
│  │  Access Control: Public create on signatures         ││            │
│  └──────────────────────────────────────────────────────┘│            │
├──────────────────────────────────────────────────────────┼────────────┤
│                         DATA LAYER                       │            │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐       │            │
│  │ PostgreSQL │  │   Media    │  │  Email       │       │            │
│  │ (Events,   │  │ (Signature │  │ (Nodemailer) │◀──────┘            │
│  │  Attendance│  │  Images)   │  │              │                    │
│  │  Days,     │  │            │  │              │                    │
│  │  Participants)│ │            │  │              │                    │
│  └────────────┘  └────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Public Sign Form** | QR code landing page, signature capture without auth | Vite SPA route, signature canvas library, public API POST |
| **Event Management** | CRUD for events, date range handling, status management | Payload collection + admin UI, custom hooks for date range → days |
| **Attendance Days** | One record per day of multi-day event, signature grouping | Payload collection with relationship to Event |
| **Participant Management** | Pre-populate from SIMV, search/filter, beneficiary type | Payload collection, custom endpoint for SIMV mock search |
| **Signature Storage** | Canvas image → file upload → relationship to participant + day | Payload Media collection, relationship fields, access control for public create |
| **Export/Finalization** | Generate XLSX with all data + signature references, email delivery | Custom Payload endpoint, XLSX library (ExcelJS/xlsx), Nodemailer |
| **SIMV Registry** | Mock directory of vets/pharmacists for search | Payload collection (seed data), or custom endpoint returning mock JSON |

## Recommended Project Structure

### Backend (Payload CMS)

```
backend/src/
├── collections/
│   ├── Events.ts              # Main event entity (name, date range, organizer, CNOV, status)
│   ├── AttendanceDays.ts      # One per day (generated from event date range)
│   ├── Participants.ts        # Person data (name, email, city, reg number, type)
│   ├── Signatures.ts          # Relationship to Participant + AttendanceDay + Media
│   ├── Media.ts               # Built-in Payload uploads (signature images)
│   ├── SimvRegistry.ts        # Mock vet/pharmacist directory (optional, or custom endpoint)
│   └── Users.ts               # Organizers (Ceva employees, Payload auth)
├── endpoints/
│   ├── search-simv.ts         # Custom API: /api/search-simv?q=name or regNumber
│   ├── finalize-event.ts      # Custom API: POST /api/events/:id/finalize → XLSX + email
│   └── public-sign.ts         # Custom API: POST /api/attendance-days/:id/sign (no auth)
├── hooks/
│   ├── generateAttendanceDays.ts  # afterChange hook on Events: create AttendanceDays
│   └── validateSignature.ts       # beforeValidate hook on Signatures: check duplicates
├── lib/
│   ├── xlsx-generator.ts      # Generate XLSX from event data + signatures
│   └── email-service.ts       # Nodemailer wrapper (send to transparence@ceva.com + organizer)
└── payload.config.ts          # Main Payload config, collections registration
```

### Frontend (Vite SPA)

```
frontend/src/
├── routes/
│   ├── public/
│   │   ├── SignPage.tsx           # /sign/:attendanceDayId (QR code landing)
│   │   └── SignatureCanvas.tsx    # Canvas component for drawing
│   ├── organizer/
│   │   ├── EventsList.tsx         # Dashboard for organizers
│   │   ├── EventCreate.tsx        # Create event form
│   │   ├── EventEdit.tsx          # Edit event, manage participants
│   │   ├── ParticipantSearch.tsx  # Search SIMV registry
│   │   └── EventFinalize.tsx      # Review + finalize button
├── hooks/
│   ├── useEvents.ts               # TanStack Query hooks for events
│   ├── useAttendanceDays.ts       # TanStack Query hooks for attendance days
│   ├── useParticipants.ts         # TanStack Query hooks for participants
│   ├── useSignatures.ts           # TanStack Query hooks for signatures
│   └── useSimvSearch.ts           # TanStack Query hook for SIMV search
├── components/
│   ├── ui/                        # shadcn/ui components (button, card, dialog, etc.)
│   ├── SignatureCanvas.tsx        # HTML5 canvas for signature capture
│   ├── ParticipantForm.tsx        # Form fields (name, email, city, type)
│   └── QRCodeDisplay.tsx          # Generate QR code for attendance day link
└── lib/
    ├── api.ts                     # Typed Payload API client
    └── utils.ts                   # cn() helper, date formatters
```

### Structure Rationale

- **Backend collections = data entities:** Each Payload collection auto-generates REST API + admin UI + types. Keep collections focused (one entity per file).
- **Custom endpoints for complex logic:** SIMV search, XLSX generation, public signing API (bypassing default access control) live in `/endpoints/`.
- **Hooks for automated workflows:** Use Payload hooks to automatically create AttendanceDays when event is saved, validate signature uniqueness, etc.
- **Frontend routes by user role:** Public routes (no auth) vs organizer routes (authenticated). React Router handles this separation.
- **TanStack Query hooks per collection:** One hook file per Payload collection for consistent data fetching patterns.

## Architectural Patterns

### Pattern 1: Public Create with Access Control Override

**What:** Allow unauthenticated users to POST signatures via a custom endpoint while keeping the collection secured in the admin UI.

**When to use:** QR code flows where external users need to submit data without authentication, but organizers need to view/manage submissions.

**Trade-offs:**
- **PRO:** No login friction for participants, standard Payload access control for organizers
- **CON:** Must implement rate limiting and validation carefully (no user context for abuse prevention)

**Example:**
```typescript
// backend/src/collections/Signatures.ts
const Signatures: CollectionConfig = {
  slug: 'signatures',
  access: {
    // Admin UI: only authenticated users can read/update/delete
    read: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,

    // Public create is BLOCKED here (default behavior)
    // We use a custom endpoint instead to validate + create
    create: () => false, // No direct API create access
  },
  fields: [
    { name: 'participant', type: 'relationship', relationTo: 'participants', required: true },
    { name: 'attendanceDay', type: 'relationship', relationTo: 'attendance-days', required: true },
    { name: 'signatureImage', type: 'upload', relationTo: 'media', required: true },
    { name: 'rightToImage', type: 'checkbox', defaultValue: false },
  ],
}

// backend/src/endpoints/public-sign.ts
export const publicSignEndpoint = {
  path: '/attendance-days/:id/sign',
  method: 'post',
  handler: async (req, res) => {
    // Validate incoming data (Zod schema)
    // Check AttendanceDay exists and event is not finalized
    // Upload signature image to Media collection
    // Create Participant if not exists
    // Create Signature with relationships
    // Return success response

    // Bypasses collection access control by using payload.create() directly
    const signature = await req.payload.create({
      collection: 'signatures',
      data: {
        participant: participantId,
        attendanceDay: req.params.id,
        signatureImage: uploadedMediaId,
        rightToImage: req.body.rightToImage,
      },
      overrideAccess: true, // Bypass access control for this operation
    })

    res.status(200).json({ success: true, id: signature.id })
  }
}
```

### Pattern 2: Date Range → Child Records Generation

**What:** When an Event has a date range (e.g., 2026-03-10 to 2026-03-12), automatically generate one AttendanceDay record per day.

**When to use:** Multi-day events where each day needs separate signature tracking, reporting, or QR codes.

**Trade-offs:**
- **PRO:** Simplifies data model (one signature → one day), allows per-day QR codes, clear audit trail
- **CON:** Generates many records for long events (acceptable for typical 1-3 day events)

**Example:**
```typescript
// backend/src/collections/Events.ts
const Events: CollectionConfig = {
  slug: 'events',
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create' || (operation === 'update' && dateRangeChanged)) {
          // Delete existing AttendanceDays for this event
          await req.payload.delete({
            collection: 'attendance-days',
            where: { event: { equals: doc.id } },
          })

          // Generate new AttendanceDays
          const days = generateDaysBetween(doc.dateFrom, doc.dateTo)
          for (const day of days) {
            await req.payload.create({
              collection: 'attendance-days',
              data: {
                event: doc.id,
                date: day,
                status: 'open',
              },
            })
          }
        }
      }
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'dateFrom', type: 'date', required: true },
    { name: 'dateTo', type: 'date', required: true },
    { name: 'expenseType', type: 'select', options: [...], required: true },
    { name: 'organizer', type: 'relationship', relationTo: 'users', required: true },
    { name: 'location', type: 'text' },
    { name: 'cnovNumber', type: 'text' },
    { name: 'status', type: 'select', options: ['draft', 'open', 'finalized'], defaultValue: 'draft' },
  ],
}
```

### Pattern 3: Signature Canvas → Upload → Relationship

**What:** Capture signature as base64 from HTML5 canvas → convert to file → upload to Payload Media → create Signature record with relationship to uploaded image.

**When to use:** Digital signature capture where signatures must be stored as files (for XLSX export, audit trail, GDPR compliance).

**Trade-offs:**
- **PRO:** Signatures stored as files (can be embedded in XLSX, backed up, deleted per GDPR), not base64 blobs in database
- **CON:** Additional upload step, file storage cost (negligible for signatures ~5-20KB each)

**Example:**
```typescript
// frontend/src/components/SignatureCanvas.tsx
import SignaturePad from 'signature_pad'

const SignatureCanvas = ({ onSign }) => {
  const canvasRef = useRef(null)
  const padRef = useRef(null)

  useEffect(() => {
    padRef.current = new SignaturePad(canvasRef.current)
  }, [])

  const handleSubmit = async () => {
    if (padRef.current.isEmpty()) {
      alert('Please provide a signature')
      return
    }

    // Convert canvas to blob
    const dataURL = padRef.current.toDataURL('image/png')
    const blob = await fetch(dataURL).then(r => r.blob())

    // Upload to Payload Media collection
    const formData = new FormData()
    formData.append('file', blob, 'signature.png')

    const uploadResponse = await fetch('/api/media', {
      method: 'POST',
      body: formData,
    })
    const { doc: uploadedMedia } = await uploadResponse.json()

    // Pass media ID to parent component
    onSign({ signatureImageId: uploadedMedia.id })
  }

  return (
    <div>
      <canvas ref={canvasRef} width={500} height={200} />
      <button onClick={() => padRef.current.clear()}>Clear</button>
      <button onClick={handleSubmit}>Submit Signature</button>
    </div>
  )
}
```

### Pattern 4: Event Status State Machine

**What:** Events transition through states: `draft` → `open` → `finalized`. Enforce rules at each state (e.g., can't edit participants when finalized, can reopen to add late participants).

**When to use:** Workflows where data must be locked after certain actions (finalization = XLSX sent, but can be reopened for amendments).

**Trade-offs:**
- **PRO:** Clear audit trail, prevents accidental edits, allows reopening for late additions
- **CON:** Requires validation logic in access control and hooks

**Example:**
```typescript
// backend/src/collections/Events.ts
const Events: CollectionConfig = {
  access: {
    update: ({ req: { user }, data }) => {
      if (!user) return false

      // Allow reopening finalized events (status change finalized → open)
      if (data.status === 'open' && req.data.status === 'finalized') {
        return true
      }

      // Prevent editing finalized events (except reopening)
      if (req.data.status === 'finalized') {
        return false
      }

      return true
    },
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      options: ['draft', 'open', 'finalized'],
      defaultValue: 'draft',
      admin: {
        description: 'draft = not visible to participants, open = QR codes active, finalized = XLSX sent'
      },
    },
  ],
}
```

### Pattern 5: SIMV Registry as Mock Collection or Custom Endpoint

**What:** Participant search from vet/pharmacist directory. Two approaches: (A) seed a Payload collection with mock data, or (B) custom endpoint returning hardcoded JSON.

**When to use:** POC phase where real SIMV API integration is out of scope. Option A allows admin UI management of mock data. Option B is simpler for pure mock.

**Trade-offs:**
- **Option A (Collection):** Can manage mock data via admin UI, queryable, relationship-ready. Requires seeding script.
- **Option B (Endpoint):** Simpler, hardcoded JSON, no database records. Can't create relationships (must create Participant on sign).

**Example (Option B - Custom Endpoint):**
```typescript
// backend/src/endpoints/search-simv.ts
export const searchSimvEndpoint = {
  path: '/search-simv',
  method: 'get',
  handler: async (req, res) => {
    const { q } = req.query // Search query (name or registration number)

    // Mock data
    const mockRegistry = [
      { id: '1', lastName: 'Dupont', firstName: 'Marie', registrationNumber: 'VET12345', city: 'Paris', type: 'veterinarian' },
      { id: '2', lastName: 'Martin', firstName: 'Pierre', registrationNumber: 'VET67890', city: 'Lyon', type: 'veterinarian' },
      { id: '3', lastName: 'Durand', firstName: 'Sophie', registrationNumber: 'PHAR11111', city: 'Marseille', type: 'pharmacist' },
      // ... more mock data
    ]

    // Filter by query (case-insensitive search on name or registration number)
    const results = mockRegistry.filter(entry =>
      entry.lastName.toLowerCase().includes(q.toLowerCase()) ||
      entry.firstName.toLowerCase().includes(q.toLowerCase()) ||
      entry.registrationNumber.toLowerCase().includes(q.toLowerCase())
    )

    res.status(200).json({ results })
  }
}
```

## Data Flow

### Request Flow: Public Signing (No Auth)

```
[Participant scans QR code]
    ↓
[GET /sign/:attendanceDayId] (Public route, Vite SPA)
    ↓
[SignPage component fetches AttendanceDay + Event data]
    ↓
[Participant fills form: name, email, city, type, draws signature]
    ↓
[SignatureCanvas.toDataURL() → Blob]
    ↓
[POST /api/media] (upload signature image, public create allowed via custom endpoint)
    ↓ (Media ID returned)
[POST /api/attendance-days/:id/sign] (custom endpoint, overrideAccess: true)
    ↓
[Create Participant if not exists (name/email/city/type)]
    ↓
[Create Signature record (participant, attendanceDay, signatureImage, rightToImage)]
    ↓
[Success response → "Thank you" confirmation page]
```

### Request Flow: Event Creation & Finalization (Authenticated)

```
[Organizer logs into /admin]
    ↓
[Navigate to Events → Create New Event]
    ↓
[Fill form: name, dateFrom, dateTo, expenseType, organizer, location, cnovNumber]
    ↓
[POST /api/events] (Payload API, authenticated)
    ↓
[afterChange hook triggers]
    ↓
[Generate AttendanceDays (one per day between dateFrom and dateTo)]
    ↓
[Event created, status = 'draft']
    ↓
[Organizer opens Event → Pre-populate participants]
    ↓
[Search SIMV via GET /search-simv?q=dupont]
    ↓
[Select participants → POST /api/participants (bulk create)]
    ↓
[Change event status to 'open' → QR codes become active]
    ↓
[Participants sign via QR code flow (see above)]
    ↓
[Organizer clicks "Finalize Event"]
    ↓
[POST /api/events/:id/finalize] (custom endpoint)
    ↓
[Fetch Event + AttendanceDays + Participants + Signatures + Media (signature images)]
    ↓
[Generate XLSX using ExcelJS/xlsx library]
    ↓
[Embed signature images in XLSX or reference by filename]
    ↓
[Send email via Nodemailer to transparence@ceva.com + organizer email]
    ↓
[Update Event status to 'finalized']
    ↓
[Success response → "Event finalized, email sent" confirmation]
```

### State Management (Frontend)

```
[TanStack Query Cache]
    ↓ (React components subscribe)
[EventsList, EventEdit, SignPage, etc.]
    ↓ (User actions)
[Mutations: createEvent, updateEvent, createSignature, etc.]
    ↓
[API calls to Payload]
    ↓
[On success: invalidate related queries, refetch]
    ↓
[UI updates automatically via TanStack Query]
```

### Key Data Flows

1. **Event → AttendanceDays (one-to-many):** When event is created/updated with date range, AttendanceDays are auto-generated via hook. Each AttendanceDay has a unique QR code link.

2. **AttendanceDay → Signatures (one-to-many):** Each signature is linked to exactly one AttendanceDay (and one Participant). Multi-day events = participant signs once per day.

3. **Signature → Media (many-to-one):** Each signature references one uploaded image in the Media collection. Media collection handles file storage (local or S3-compatible).

4. **Event Finalization → XLSX + Email:** Custom endpoint aggregates all related data, generates XLSX, sends via email, updates event status to 'finalized'.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-800 events/year (current volume) | Monolith architecture is fine. Payload + PostgreSQL + local file storage. Single Node.js instance. No caching layer needed. |
| 800-5000 events/year | Optimize signature image storage (move to S3-compatible storage with Payload storage adapter). Add Redis for session caching. Monitor PostgreSQL query performance (index on event status, date ranges). |
| 5000+ events/year | Consider CDN for signature images (CloudFlare). Separate read replicas for reporting queries (XLSX generation). Implement background job queue for XLSX generation (BullMQ + Redis) to avoid blocking API requests. |

### Scaling Priorities

1. **First bottleneck: File storage (signatures)**
   - **What breaks:** Local disk fills up with signature images (~5-10KB each, but 5000-10000/year = 50-100MB/year, manageable for POC)
   - **Fix:** Switch to S3-compatible storage using Payload's storage adapter plugin. Cost: ~$0.50/year for storage, negligible.

2. **Second bottleneck: XLSX generation blocking API**
   - **What breaks:** When event has 50+ participants, XLSX generation can take 5-10 seconds, blocking the request. Organizer sees timeout error.
   - **Fix:** Move XLSX generation to background job (BullMQ). Return immediate response "Email will be sent shortly", generate XLSX asynchronously, send email when done.

3. **Third bottleneck: Database query performance**
   - **What breaks:** Fetching all signatures + participants + media for finalization query becomes slow with thousands of records.
   - **Fix:** Add database indexes on foreign keys (event, attendanceDay, participant). Use Payload's `depth: 1` population carefully (don't over-populate nested relationships).

## Anti-Patterns

### Anti-Pattern 1: Storing Signatures as Base64 in Database

**What people do:** Save signature canvas output (base64 PNG string) directly as a `text` field in the Signature record.

**Why it's wrong:**
- Bloats database size (base64 is 33% larger than binary)
- Can't embed in XLSX easily (need to decode, write to temp file, reference)
- GDPR deletion is harder (must delete database record AND clear any backups)
- No file-level access control or CDN delivery

**Do this instead:** Upload signature to Payload Media collection (as file), create Signature record with relationship to Media ID. Payload handles file storage, access control, and cleanup.

### Anti-Pattern 2: Single AttendanceSheet Collection for Multi-Day Events

**What people do:** Create one AttendanceSheet record per event, store all signatures in a JSON array field like `{ signatures: [{ day: '2026-03-10', participant: 'X', signature: 'base64...' }] }`.

**Why it's wrong:**
- Can't generate per-day QR codes (QR code must link to a specific resource ID)
- Querying/filtering by day is complex (must parse JSON array)
- Relationship integrity is lost (can't enforce foreign keys)
- Concurrent writes are problematic (two participants signing simultaneously = race condition on JSON array update)

**Do this instead:** One AttendanceDay record per day (with relationship to Event), one Signature record per participant per day. Relationships are explicit, queryable, and support concurrent writes.

### Anti-Pattern 3: Allowing Public Create on Main Collections Without Validation

**What people do:** Set `access.create: () => true` on Participants or Signatures collection to allow public API access.

**Why it's wrong:**
- No validation of input data (spam/abuse possible)
- No rate limiting (could create thousands of fake records)
- No business logic enforcement (can create signature for finalized event, duplicate signatures, etc.)

**Do this instead:** Use custom endpoints with `overrideAccess: true` for public operations. Implement validation (Zod schemas), rate limiting (check IP/session), and business logic (check event status, prevent duplicates) in the endpoint handler.

### Anti-Pattern 4: Generating QR Code on Frontend with Event ID

**What people do:** Generate QR code linking to `/sign?eventId=123`, expect frontend to fetch event and show all days for user to choose which day to sign.

**Why it's wrong:**
- Ambiguous for multi-day events (which day is the participant signing for?)
- Requires additional UI for day selection (friction for participants)
- Can't track which QR code was scanned (all days share same link)

**Do this instead:** Generate one QR code per AttendanceDay, linking to `/sign/:attendanceDayId`. QR code is specific to one day, no ambiguity. Organizers can print separate QR codes per day or use same code if event is single-day.

### Anti-Pattern 5: Hardcoding Organizer Email in Code

**What people do:** In XLSX generation endpoint, send email to hardcoded `transparence@ceva.com` and `organizer@example.com`.

**Why it's wrong:**
- Changing email recipients requires code change + deployment
- Can't handle different organizers for different events (all events go to same email)
- No flexibility for testing (test events spam production email)

**Do this instead:** Store organizer email as a field on the Event record (or use organizer relationship → user.email). Send to `transparence@ceva.com` (constant) AND `event.organizer.email` (dynamic). Add environment variable for testing (`TEST_MODE=true` → send to test email instead).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **SIMV Registry API** (future) | REST API client in custom endpoint, cache results in Redis | POC uses mock data via custom endpoint. Production would call real SIMV API, cache responses (registry doesn't change often). |
| **Email (Nodemailer)** | SMTP via environment variables (host, port, user, password) | POC uses Ceva's internal SMTP server. Config via `.env`. Test mode sends to test email. |
| **File Storage (S3)** (future) | Payload storage adapter plugin (`@payloadcms/plugin-cloud-storage`) | POC uses local file storage. Production should use S3-compatible storage (AWS S3, Cloudflare R2, Wasabi). |
| **QR Code Generation** | Frontend library (`qrcode.react`) or backend library (`qrcode`) for print view | Generate QR code from AttendanceDay URL (`https://c-sign.ceva.com/sign/:id`). Display in organizer UI for printing/sharing. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Frontend ↔ Payload API** | REST API over HTTPS, JSON payloads | Frontend uses TanStack Query for all API calls. Payload auto-generates REST endpoints from collections. Custom endpoints for complex operations (SIMV search, finalization). |
| **Payload ↔ PostgreSQL** | Drizzle ORM (managed by Payload) | Payload handles all database queries via Drizzle. Migrations auto-generated. No raw SQL needed in POC. |
| **Payload ↔ File Storage** | Payload Media collection, local filesystem or S3 adapter | Media collection abstracts file storage. POC uses local, production uses S3 adapter (plugin). |
| **Payload ↔ Email** | Nodemailer (SMTP client) | Email sending triggered from custom endpoint (finalization). Nodemailer configured via environment variables. |

## Sources

**Payload CMS Documentation:**
- [Relationship Field](https://payloadcms.com/docs/fields/relationship) — How to model one-to-many and many-to-many relationships
- [Collection Configs](https://payloadcms.com/docs/configuration/collections) — Collection structure and configuration options
- [Uploads](https://payloadcms.com/docs/upload/overview) — Media collection and file upload patterns
- [Storage Adapters](https://payloadcms.com/docs/upload/storage-adapters) — How to integrate S3-compatible storage
- [Access Control](https://payloadcms.com/docs/access-control/overview) — Collection-level and field-level access control
- [Collection Access Control](https://payloadcms.com/docs/access-control/collections) — Operation-specific access control (create, read, update, delete)
- [Authentication Overview](https://payloadcms.com/docs/authentication/overview) — Built-in auth with email/password
- [Nested Docs Plugin](https://payloadcms.com/docs/plugins/nested-docs) — Plugin for hierarchical document structures
- [Import Export Plugin](https://payloadcms.com/docs/plugins/import-export) — CSV/JSON/XLSX export functionality

**Architecture Patterns:**
- [A Simple, Realtime, Event Driven Architecture with QR Codes](https://hasura.io/blog/a-simple-real-time-event-driven-architecture-with-qr-codes) — QR code event-driven patterns
- [Recurring Calendar Events — Database Design](https://medium.com/@aureliadotlim/recurring-calendar-events-database-design-dc872fb4f2b5) — Date range and multi-day event modeling
- [Data Integration Best Practices for 2026: Architecture & Tools](https://www.domo.com/learn/article/data-integration-best-practices) — Modern data architecture principles

**Signature Capture:**
- [10 Best Signature Pad Plugins In JavaScript (2026 Update)](https://www.jqueryscript.net/blog/best-signature-pad.html) — HTML5 canvas signature libraries
- [Implementing a signature pad with JavaScript](https://blog.logrocket.com/implementing-signature-pad-javascript/) — Signature pad implementation guide

**Event Attendance Tracking:**
- [Event Attendance Tracking: How to Go Beyond Headcount to Boost ROI](https://www.eventmobi.com/blog/event-attendance-tracking/) — Multi-day event tracking patterns
- [Event Data Analytics & Reporting in 2026](https://www.ticketfairy.com/blog/event-data-analytics-reporting-in-2026-turning-attendee-behavior-into-actionable-insights) — Modern event data architecture

---
*Architecture research for: c-sign Digital Attendance Sheet*
*Researched: 2026-02-13*
