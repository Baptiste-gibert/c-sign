# Phase 1: Foundation & Data Model - Research

**Researched:** 2026-02-13
**Domain:** Payload CMS 3.x with PostgreSQL (Drizzle ORM)
**Confidence:** MEDIUM-HIGH

## Summary

Phase 1 establishes the core data architecture for a multi-day event attendance system using Payload CMS 3.x with PostgreSQL. The system must support non-consecutive event dates, per-session signature tracking, organizer-scoped access control, and a taxonomy of 7 beneficiary types with conditional field revelation.

Key technical challenges include: (1) auto-generating child AttendanceDay records via afterChange hooks when event dates change, (2) implementing role-based access control where Organizers see only their own events, (3) storing array-of-dates instead of date ranges to support non-consecutive days, and (4) conditional admin UI fields for the "Autre" beneficiary type.

**Primary recommendation:** Use Payload's relationship fields with `hasMany: true` for the Event → AttendanceDay → Session hierarchy. Leverage `afterChange` hooks (not `beforeChange`) to auto-generate AttendanceDay records after event date changes, since document IDs are only available post-creation. Implement RBAC using access control functions that return query constraints filtering by `createdBy` field.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Beneficiary taxonomy:**
- 7 types: Vétérinaire, Pharmacien, Étudiant, ASV, Technicien, Éleveur, Autre
- List is complete — no additions needed
- Alphabetical ordering in dropdowns
- French labels only for now (bilingual comes in Phase 5)
- "Autre" reveals a free text field for the participant to specify their role

**Multi-day event behavior:**
- Events support non-consecutive days (not just a continuous date range)
- Organizer picks specific dates via a multi-date picker calendar
- Each selected date generates one AttendanceDay record
- When dates change: new days are added, existing days are never auto-removed
- If a day becomes outside the event's selected dates (orphaned), flag it visually with a warning badge
- Note: This changes the data model from a simple start/end range to an array of selected dates

**Organizer auth & admin:**
- Organizers use Payload's built-in admin panel for Phase 1 (custom dashboard comes in Phase 3)
- Individual accounts per organizer (not shared team login)
- Admin-created accounts only (no self-registration)
- Two roles: Admin (manage users + settings) and Organizer (manage own events only)

**Signature-to-attendance linking:**
- Multiple signatures per participant per day are allowed
- Sessions are explicitly defined by the organizer (e.g., "Conférence", "Déjeuner", "Atelier")
- Organizer creates custom session names and count per attendance day
- Each session generates its own QR code / signing opportunity
- One signature per participant per session
- In XLSX export (Phase 4): each session gets its own signature column

### Claude's Discretion
- Payload collection naming and structure
- Database schema optimization
- Admin panel field grouping and layout
- Seed data for development/testing

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @payloadcms/next | 3.75+ | Payload CMS runtime | Official Next.js 15 adapter, serves admin UI + REST API |
| @payloadcms/db-postgres | 3.75+ | PostgreSQL adapter | Official Drizzle-based adapter with migration support |
| @payloadcms/richtext-lexical | 3.75+ | Rich text editor | Official editor for text content |
| @payloadcms/ui | 3.75+ | Admin UI components | Official component library for custom admin fields |
| drizzle-orm | Latest | ORM layer | Payload's underlying ORM, auto-generates schema from config |
| sharp | Latest | Image optimization | Required for Payload upload/media collections |
| zod | 3.x | Schema validation | Standard validation library for both frontend/backend |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-zod | Latest | Generate Zod schemas from Drizzle | Type-safe validation schemas derived from database schema |
| cross-env | Latest | Cross-platform env vars | Set NODE_ENV consistently across platforms |
| react-signature-canvas | 1.x | Signature capture (frontend) | Phase 2 - public signing flow |
| qrcode.react | Latest | QR code generation (frontend) | Phase 2 - QR code for event access |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @payloadcms/db-postgres | @payloadcms/db-vercel-postgres | Vercel-optimized version uses `@vercel/postgres` pooling; only needed if deploying to Vercel |
| drizzle-orm | Prisma | Drizzle is Payload's official ORM; switching breaks Payload's migration system |
| @payloadcms/richtext-lexical | @payloadcms/richtext-slate | Lexical is the modern editor; Slate is legacy (v2.x) |

**Installation:**
```bash
cd /workspace/backend
npm install payload@latest @payloadcms/next@latest @payloadcms/db-postgres@latest @payloadcms/richtext-lexical@latest @payloadcms/ui@latest
npm install drizzle-orm sharp cross-env zod
npm install -D typescript @types/node @types/react @types/react-dom drizzle-zod
```

---

## Architecture Patterns

### Recommended Project Structure
```
backend/src/
├── payload.config.ts         # Main Payload configuration
├── collections/              # Collection definitions (schema-as-code)
│   ├── Users.ts              # Organizer accounts with roles
│   ├── Events.ts             # Parent: event metadata, dates array
│   ├── AttendanceDays.ts     # Child: one per event date
│   ├── Sessions.ts           # Child: one per session per day
│   ├── Participants.ts       # Participant registry (pre-populated or on-demand)
│   ├── Signatures.ts         # Signature records (links Participant + Session)
│   └── Media.ts              # Upload collection for signature images
├── access/                   # Access control functions
│   ├── isAdmin.ts            # Admin-only access
│   ├── isAdminOrSelf.ts      # Admin or own records
│   └── organizerScoped.ts    # Filter by createdBy field
├── hooks/                    # Lifecycle hooks
│   └── events/
│       └── afterChange.ts    # Auto-generate AttendanceDays on date change
└── seed/                     # Development seed data
    └── index.ts              # Seed script using Payload Local API
```

### Pattern 1: Parent-Child Collections with Relationship Fields

**What:** Use `relationship` fields with `hasMany: true` to model one-to-many hierarchies (Event → AttendanceDays → Sessions).

**When to use:** When child records need their own admin UI and can be managed independently. Payload's Nested Docs plugin is for same-collection hierarchies (e.g., nested pages); use relationship fields for distinct collections.

**Example:**
```typescript
// Source: https://payloadcms.com/docs/fields/relationship
import { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'selectedDates',
      type: 'array',
      label: 'Event Dates',
      required: true,
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
        },
      ],
    },
    {
      name: 'attendanceDays',
      type: 'relationship',
      relationTo: 'attendance-days',
      hasMany: true,
      admin: {
        readOnly: true, // Managed by hooks
      },
    },
  ],
}
```

### Pattern 2: Auto-Generate Child Records via afterChange Hook

**What:** Use `afterChange` hook (NOT `beforeChange`) to create related records after document creation/update.

**When to use:** When child records must reference the parent's ID. In `beforeChange`, document IDs are not yet available on create operations.

**Example:**
```typescript
// Source: https://payloadcms.com/docs/hooks/collections
import { CollectionAfterChangeHook } from 'payload'

export const afterEventChange: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  previousDoc,
}) => {
  const selectedDates = doc.selectedDates || []
  const existingDays = previousDoc?.attendanceDays || []

  // Create AttendanceDay for each new date
  for (const dateObj of selectedDates) {
    const existingDay = existingDays.find(
      (day) => day.date === dateObj.date
    )

    if (!existingDay) {
      await req.payload.create({
        collection: 'attendance-days',
        data: {
          event: doc.id,
          date: dateObj.date,
        },
        req, // Pass req for access control context
      })
    }
  }

  // Note: Do NOT auto-delete orphaned days (per user decision)
  // Instead, flag them in admin UI with custom field component

  return doc
}
```

### Pattern 3: Role-Based Access Control with Query Constraints

**What:** Access control functions can return boolean (allow/deny) OR a query constraint that filters data by user.

**When to use:** Implement "Organizers see only their own events" without exposing other users' data.

**Example:**
```typescript
// Source: https://payloadcms.com/docs/access-control/collections
import { Access } from 'payload'

export const organizerScoped: Access = ({ req: { user } }) => {
  // Admins see everything
  if (user?.role === 'admin') {
    return true
  }

  // Organizers see only their own records
  if (user?.role === 'organizer') {
    return {
      createdBy: {
        equals: user.id,
      },
    }
  }

  // No user = no access
  return false
}
```

### Pattern 4: Conditional Field Revelation

**What:** Use `admin.condition` to show/hide fields based on other field values.

**When to use:** Reveal "Autre (préciser)" text field only when beneficiary type is "Autre".

**Example:**
```typescript
// Source: https://payloadcms.com/docs/fields/overview
{
  name: 'beneficiaryType',
  type: 'select',
  required: true,
  options: [
    { label: 'ASV', value: 'asv' },
    { label: 'Autre', value: 'autre' },
    { label: 'Éleveur', value: 'eleveur' },
    { label: 'Étudiant', value: 'etudiant' },
    { label: 'Pharmacien', value: 'pharmacien' },
    { label: 'Technicien', value: 'technicien' },
    { label: 'Vétérinaire', value: 'veterinaire' },
  ],
},
{
  name: 'beneficiaryTypeOther',
  type: 'text',
  label: 'Préciser',
  admin: {
    condition: (data) => data?.beneficiaryType === 'autre',
  },
}
```

**Note:** Conditional fields within array fields have known issues in Payload 3.x. If placing conditional fields inside an array, verify behavior with current version.

### Pattern 5: Upload Collection for Media

**What:** Enable `upload: true` on a collection to transform it into a file storage system with automatic `filename`, `mimeType`, and `filesize` fields.

**When to use:** Store signature images (captured via canvas on frontend, sent as base64/blob to backend).

**Example:**
```typescript
// Source: https://payloadcms.com/docs/upload/overview
export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 200,
        height: 100,
        fit: 'contain',
      },
    ],
    formatOptions: {
      format: 'webp', // Auto-convert all uploads to webp
      options: {
        quality: 80,
      },
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
}
```

**Sharp dependency:** Payload requires `sharp` for image processing. Install with `npm install sharp`.

### Anti-Patterns to Avoid

- **Using beforeChange to create child records:** IDs are unavailable during creation. Use `afterChange` instead.
- **Deep-cloning collections in hooks with JSON.stringify/parse:** Strips functions (hooks are async functions). Manually spread/extend instead.
- **Importing JSX inside payload.config.ts:** From Payload v3+, config files should not import JSX components. Keep config and UI layers separate.
- **Calling payload.update in afterChange without infinite loop protection:** Use `context` property to conditionally prevent re-triggering hooks.
- **Auto-deleting orphaned AttendanceDays:** Per user decision, orphaned days should be flagged with warnings, not deleted.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image upload + optimization | Custom multer + sharp pipeline | Payload Upload collection | Automatic filename generation, MIME validation, Sharp integration, thumbnail generation, format conversion |
| Admin CRUD UI | Custom React admin panels | Payload's auto-generated admin | Admin UI, list views, filters, search generated from collection config |
| Database migrations | Manual SQL scripts | Drizzle migrations via Payload | `pnpm payload migrate:create` generates SQL diffs from config changes |
| Access control / RBAC | Custom middleware | Payload access control functions | Scoped per-operation (create/read/update/delete), field-level control, query constraint filtering |
| API endpoints | Custom Express routes | Payload's REST API | Auto-generated CRUD endpoints, hooks for custom logic, typed responses |
| Signature canvas rendering | Custom canvas API | react-signature-canvas | Wrapper around signature_pad with 100% test coverage, TypeScript types, ref-based API |
| QR code generation | Custom canvas/SVG | qrcode.react | Battle-tested, supports error correction levels, styling options |

**Key insight:** Payload CMS is "config-as-code" — most features are configured, not coded. Building custom solutions bypasses Payload's auto-generated admin UI, migrations, and API, creating maintenance debt.

---

## Common Pitfalls

### Pitfall 1: Infinite Loops in Lifecycle Hooks

**What goes wrong:** Calling `payload.update()` on the same collection inside `beforeChange`, `afterChange`, `beforeRead`, or `afterRead` hooks creates infinite recursion. Update triggers another lifecycle event, which triggers the hook again, ad infinitum.

**Why it happens:** Hooks fire on every matching operation. Without loop protection, the hook re-triggers itself.

**How to avoid:** Use the `context` property to flag that an update originated from the hook.

**Example:**
```typescript
export const afterChange: CollectionAfterChangeHook = async ({ doc, req }) => {
  // Prevent infinite loop by checking context
  if (req.context.preventLoop) {
    return doc
  }

  await req.payload.update({
    collection: 'events',
    id: doc.id,
    data: { /* updates */ },
    context: {
      ...req.context,
      preventLoop: true, // Flag to prevent re-triggering
    },
  })

  return doc
}
```

**Warning signs:** Server timeouts, out-of-memory errors, logs showing repeated hook executions.

### Pitfall 2: Array-of-Dates vs. Date Range

**What goes wrong:** Using a single `startDate` and `endDate` field assumes events span consecutive days. Non-consecutive events (e.g., Monday workshop + Thursday follow-up) require manual workarounds.

**Why it happens:** Traditional event systems use date ranges. Payload's `date` field doesn't natively support multi-select.

**How to avoid:** Use an `array` field containing `date` fields. Each array item represents one selected date.

**Data model:**
```typescript
{
  name: 'selectedDates',
  type: 'array',
  fields: [
    {
      name: 'date',
      type: 'date',
      required: true,
    },
  ],
}
```

**Warning signs:** Feature requests for "skip dates" or manual AttendanceDay creation for non-consecutive days.

### Pitfall 3: Conditional Fields Inside Arrays

**What goes wrong:** In Payload 3.x, conditional fields inside array fields may not render/hide correctly. The `admin.condition` function evaluates but has no effect on visibility.

**Why it happens:** Known issue tracked in Payload 3.x GitHub discussions.

**How to avoid:** Place conditional fields at the top level of the collection, not inside arrays. If conditionals inside arrays are required, test thoroughly with current Payload version and consider custom field components as fallback.

**Workaround:** Use a custom field component from `@payloadcms/ui` with `useFormFields` hook to manually control visibility.

**Warning signs:** Conditional fields not appearing/disappearing as expected when testing the admin UI.

### Pitfall 4: Forgetting to Pass `req` in Local API Calls

**What goes wrong:** When calling Payload's Local API (e.g., `payload.create()`, `payload.update()`) from a hook, forgetting to pass `req` bypasses access control checks. Organizer-scoped records could be created without proper ownership.

**Why it happens:** Local API calls default to super-admin context if no `req` is provided.

**How to avoid:** Always pass `req` parameter to Local API methods when calling from hooks.

**Example:**
```typescript
await req.payload.create({
  collection: 'attendance-days',
  data: { /* ... */ },
  req, // CRITICAL: Passes user context for access control
})
```

**Warning signs:** Access control bypassed during hook-triggered operations, wrong `createdBy` values.

### Pitfall 5: Sharp Missing in Production

**What goes wrong:** Deployment fails or image uploads error with "sharp not found" errors.

**Why it happens:** Sharp is a native dependency with platform-specific binaries. In serverless environments (Lambda, Vercel), it may be excluded from the bundle to reduce size.

**How to avoid:**
1. Ensure `sharp` is in `dependencies` (not `devDependencies`) in package.json
2. For serverless deployments, verify Sharp is included in deployment bundle
3. Test image upload in production-like environment before deploying

**Warning signs:** Local dev works, production image uploads fail with module not found errors.

---

## Code Examples

Verified patterns from official sources and community best practices.

### Collections with Auth and Roles

```typescript
// Source: https://payloadcms.com/docs/authentication/overview
import { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true, // Enables authentication
  admin: {
    useAsTitle: 'email',
  },
  access: {
    // Only admins can create users (no self-registration)
    create: ({ req: { user } }) => user?.role === 'admin',
    // Users can read their own record, admins can read all
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        id: { equals: user?.id },
      }
    },
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'organizer',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Organizer', value: 'organizer' },
      ],
    },
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
  ],
}
```

### Event Collection with Date Array and Hooks

```typescript
// Source: Inferred from https://payloadcms.com/docs/fields/array + hooks patterns
import { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'location', 'createdBy', 'createdAt'],
  },
  access: {
    create: ({ req: { user } }) => Boolean(user), // Any authenticated user
    read: organizerScoped, // See access control pattern above
    update: organizerScoped,
    delete: organizerScoped,
  },
  hooks: {
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        // Auto-generate AttendanceDay records for new dates
        const selectedDates = doc.selectedDates || []
        const existingDayRefs = previousDoc?.attendanceDays || []

        // Fetch existing AttendanceDay documents
        const { docs: existingDays } = await req.payload.find({
          collection: 'attendance-days',
          where: {
            event: { equals: doc.id },
          },
          limit: 1000,
        })

        // Create missing days
        for (const dateObj of selectedDates) {
          const dayExists = existingDays.some(
            (day) => day.date === dateObj.date
          )

          if (!dayExists) {
            await req.payload.create({
              collection: 'attendance-days',
              data: {
                event: doc.id,
                date: dateObj.date,
              },
              req,
            })
          }
        }

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'location',
      type: 'text',
      required: true,
    },
    {
      name: 'selectedDates',
      type: 'array',
      label: 'Event Dates',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
      ],
    },
    {
      name: 'expenseType',
      type: 'select',
      required: true,
      options: [
        { label: 'Hospitality - Snack', value: 'hospitality_snack' },
        { label: 'Hospitality - Catering', value: 'hospitality_catering' },
        { label: 'Hospitality - Accommodation', value: 'hospitality_accommodation' },
        { label: 'Event Registration Fees', value: 'event_registration' },
        { label: 'Meeting/Organization Fees', value: 'meeting_organization' },
        { label: 'Transport Fees', value: 'transport' },
      ],
    },
    {
      name: 'cnovDeclarationNumber',
      type: 'text',
      label: 'CNOV Declaration Number',
    },
    {
      name: 'organizerName',
      type: 'text',
      required: true,
      label: 'Organizer Name',
    },
    {
      name: 'organizerEmail',
      type: 'email',
      required: true,
      label: 'Organizer Email',
    },
    {
      name: 'attendanceDays',
      type: 'relationship',
      relationTo: 'attendance-days',
      hasMany: true,
      admin: {
        readOnly: true,
        description: 'Auto-generated from selected dates',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        readOnly: true,
      },
    },
  ],
}
```

### AttendanceDay Collection

```typescript
import { CollectionConfig } from 'payload'

export const AttendanceDays: CollectionConfig = {
  slug: 'attendance-days',
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['event', 'date', 'sessions'],
  },
  access: {
    // Inherit access from parent Event
    create: organizerScoped,
    read: async ({ req: { user, payload } }) => {
      if (user?.role === 'admin') return true

      // Organizers can read days belonging to their events
      const { docs: userEvents } = await payload.find({
        collection: 'events',
        where: {
          createdBy: { equals: user?.id },
        },
        limit: 1000,
      })

      return {
        event: {
          in: userEvents.map((e) => e.id),
        },
      }
    },
    update: organizerScoped, // Same pattern as read
    delete: organizerScoped,
  },
  fields: [
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'sessions',
      type: 'relationship',
      relationTo: 'sessions',
      hasMany: true,
      admin: {
        description: 'Sessions for this attendance day',
      },
    },
  ],
}
```

### Participant Collection with Beneficiary Type

```typescript
import { CollectionConfig } from 'payload'

export const Participants: CollectionConfig = {
  slug: 'participants',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['lastName', 'firstName', 'email', 'beneficiaryType'],
  },
  fields: [
    {
      name: 'lastName',
      type: 'text',
      required: true,
      label: 'Nom',
    },
    {
      name: 'firstName',
      type: 'text',
      required: true,
      label: 'Prénom',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'city',
      type: 'text',
      required: true,
      label: 'Ville',
    },
    {
      name: 'professionalNumber',
      type: 'text',
      label: 'Numéro d\'inscription professionnelle',
      admin: {
        description: 'Si applicable (vétérinaires, pharmaciens)',
      },
    },
    {
      name: 'beneficiaryType',
      type: 'select',
      required: true,
      label: 'Type de bénéficiaire',
      options: [
        { label: 'ASV', value: 'asv' },
        { label: 'Autre', value: 'autre' },
        { label: 'Éleveur', value: 'eleveur' },
        { label: 'Étudiant', value: 'etudiant' },
        { label: 'Pharmacien', value: 'pharmacien' },
        { label: 'Technicien', value: 'technicien' },
        { label: 'Vétérinaire', value: 'veterinaire' },
      ],
    },
    {
      name: 'beneficiaryTypeOther',
      type: 'text',
      label: 'Préciser le type',
      admin: {
        condition: (data) => data?.beneficiaryType === 'autre',
        description: 'Requis lorsque "Autre" est sélectionné',
      },
    },
  ],
}
```

### Seed Data Pattern

```typescript
// Source: https://payloadcms.com/docs/local-api/overview + GitHub examples
import { Payload } from 'payload'

export const seed = async (payload: Payload): Promise<void> => {
  // Create admin user
  const admin = await payload.create({
    collection: 'users',
    data: {
      email: 'admin@ceva.com',
      password: 'admin123', // Change in production
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
    },
  })

  // Create organizer user
  const organizer = await payload.create({
    collection: 'users',
    data: {
      email: 'organizer@ceva.com',
      password: 'organizer123',
      role: 'organizer',
      firstName: 'Isabelle',
      lastName: 'Leroy',
    },
  })

  // Create test event
  const event = await payload.create({
    collection: 'events',
    data: {
      title: 'Formation Vétérinaires - Q1 2026',
      location: 'Libourne, France',
      selectedDates: [
        { date: '2026-03-15' },
        { date: '2026-03-16' },
      ],
      expenseType: 'hospitality_catering',
      organizerName: 'Isabelle Leroy',
      organizerEmail: 'isabelle.leroy@ceva.com',
      createdBy: organizer.id,
    },
  })

  console.log('Seed data created successfully')
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Payload v2.x with MongoDB | Payload v3.x with PostgreSQL/Drizzle | Jan 2024 (v3 beta) | Better relational data support, auto-migrations, Drizzle ecosystem |
| @payloadcms/richtext-slate | @payloadcms/richtext-lexical | Payload v3 | Lexical is the modern editor, Slate is legacy |
| Manual JSX imports in config | Separate config/UI layers | Payload v3 | Config files must not import JSX; prevents bundle issues |
| beforeChange for child creation | afterChange for child creation | Always best practice | beforeChange lacks document ID on create |
| Single date range (start/end) | Array of selected dates | User decision 2026-02-13 | Supports non-consecutive event days |

**Deprecated/outdated:**
- **@payloadcms/richtext-slate:** Legacy editor, use Lexical instead
- **MongoDB adapter patterns:** v3 optimized for SQL (PostgreSQL, SQLite)
- **Global state in hooks:** Use `context` property to pass data between hooks instead of global variables

---

## Open Questions

1. **Multi-date picker UI in Payload admin**
   - What we know: Payload's native `date` field uses react-datepicker with `pickerAppearance` property (dayOnly, dayAndTime, etc.)
   - What's unclear: react-datepicker doesn't natively support multi-select in one picker. Array-of-dates works but requires adding/removing array rows.
   - Recommendation: For Phase 1, use array field with single-date rows. If UX feedback demands true multi-select calendar, build custom field component using @payloadcms/ui and a library like react-multi-date-picker.

2. **Orphaned day warning badge implementation**
   - What we know: Custom field components can access form data via `useFormFields` hook
   - What's unclear: Best pattern for visual warning badge in admin list view (not just edit form)
   - Recommendation: Phase 1 can defer this UX feature. Orphaned days are preserved (data integrity priority). Warning UI can be added in Phase 3 when custom dashboard is built.

3. **Signature image storage optimization**
   - What we know: Sharp auto-converts uploads to webp with quality settings. Base64 signature strings from canvas are large.
   - What's unclear: Optimal workflow — frontend sends base64 or blob? Backend accepts via REST endpoint or custom upload?
   - Recommendation: Frontend converts canvas to blob, sends via multipart/form-data to Payload's auto-generated Media upload endpoint. Backend stores as webp (quality 80). Test with real signature data to verify file sizes.

4. **Access control for nested relationships**
   - What we know: AttendanceDay access can filter by parent Event's `createdBy` via query
   - What's unclear: Performance implications of nested `payload.find()` calls in access control functions for large datasets
   - Recommendation: For Phase 1 POC (20 events/year), nested queries are fine. Monitor query performance. If slow, add `eventCreatedBy` field directly on AttendanceDay (denormalized) for faster filtering.

---

## Sources

### Primary (HIGH confidence)
- [Payload CMS Collection Configs](https://payloadcms.com/docs/configuration/collections) - Collection structure and field types
- [Payload CMS Relationship Field](https://payloadcms.com/docs/fields/relationship) - hasMany and relationTo patterns
- [Payload CMS Collection Hooks](https://payloadcms.com/docs/hooks/collections) - afterChange vs beforeChange
- [Payload CMS Access Control](https://payloadcms.com/docs/access-control/overview) - RBAC and query constraints
- [Payload CMS Uploads](https://payloadcms.com/docs/upload/overview) - Media collection configuration
- [Payload CMS PostgreSQL Adapter](https://payloadcms.com/docs/database/postgres) - Drizzle setup and config
- [Payload CMS Authentication](https://payloadcms.com/docs/authentication/overview) - Built-in auth with roles

### Secondary (MEDIUM confidence)
- [PayloadCMS Tips and Tricks - dFlow](https://dflow.sh/blog/payloadcms-tips-and-tricks) - Pitfalls: infinite loops, deep-cloning, JSX imports
- [Build Your Own RBAC in Payload](https://payloadcms.com/posts/blog/build-your-own-rbac) - Role-based access patterns
- [Payload CMS Array Field](https://payloadcms.com/docs/fields/array) - Array field with nested date fields
- [Payload CMS Conditional Fields](https://payloadcms.com/docs/fields/overview) - admin.condition property
- [Payload CMS Migrations](https://payloadcms.com/docs/database/migrations) - migrate:create workflow
- [Payload CMS Seed Data Discussion](https://github.com/payloadcms/payload/discussions/2644) - Testing best practices

### Tertiary (LOW confidence - verification needed)
- [react-signature-canvas on npm](https://www.npmjs.com/package/react-signature-canvas) - Signature capture library
- [qrcode.react](https://www.npmjs.com/package/qrcode.react) - QR code generation
- [GitHub: Payload Nested Docs Plugin](https://payloadcms.com/docs/plugins/nested-docs) - Parent-child patterns (noted: for same-collection hierarchies)
- [Payload Community: Conditional fields in arrays](https://payloadcms.com/community-help/discord/conditionally-rendering-options-within-a-second-select-field-based-on-the-value-of-the-first) - Known issue in v3

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Payload packages with verified versions from npm, codebase already specifies Payload 3.x + PostgreSQL
- Architecture: MEDIUM-HIGH - Relationship patterns, hooks, and access control verified from official docs; multi-date picker UI is custom implementation area
- Pitfalls: HIGH - Infinite loop and beforeChange/afterChange ID issues documented in official Payload guides and community tips
- Data model: HIGH - User decisions locked in CONTEXT.md, collections map directly to functional requirements

**Research date:** 2026-02-13
**Valid until:** 2026-03-15 (30 days - Payload CMS is stable, but v3.x is actively developed with bi-weekly releases)
