# Phase 03: Event Management - Research

**Researched:** 2026-02-13
**Domain:** Authenticated organizer UI, CRUD operations, dynamic forms, search/autocomplete, real-time dashboards
**Confidence:** MEDIUM-HIGH

## Summary

Phase 3 implements the organizer-facing interface for creating and managing events with multi-day attendance tracking, participant list management with search/autocomplete, and real-time attendance monitoring. This is the first authenticated frontend work in the project, requiring protected routes, complex form state management (dynamic date arrays, participant lists), search UX patterns, and dashboard updates.

Unlike Phase 2's public anonymous flow, Phase 3 requires full authentication with Payload CMS JWT tokens, protected routes using React Router's context patterns, and organizer-scoped access control already implemented in backend (`organizerScoped` access function). The data model from Phase 1 already supports the per-day attendance model (Event → AttendanceDays → Sessions → Signatures), so this phase focuses entirely on frontend UI for managing these relationships.

**Primary recommendation:** Use Payload CMS REST API authentication endpoints (`POST /api/users/login`, `GET /api/users/me`) with JWT stored in HTTP-only cookies (already configured), React Router's protected route pattern with context-based auth state, shadcn/ui Combobox for SIMV registry search (built on Radix Popover + Command), shadcn/ui Data Table with TanStack Table for participant lists, React Hook Form's useFieldArray for dynamic date management, and TanStack Query's refetchInterval for real-time attendance polling.

**Critical insights:**
- Payload CMS already handles JWT in HTTP-only cookies — frontend just needs to call login endpoint and check `/api/users/me`
- useFieldArray requires objects (not primitives), must use field.id as key (not index), and can't stack actions
- Combobox pattern (Popover + Command) is shadcn/ui standard for searchable dropdowns
- Real-time "dashboard" can be simple polling with refetchInterval — no websockets needed for this scale
- Mock SIMV registry should use MSW (Mock Service Worker) + faker.js for development until real integration

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Router DOM | 7.x | Client-side routing, protected routes | Already installed in Phase 2, v7 has improved auth patterns |
| TanStack Query | 5.x | Server state, caching, mutations | Already installed, handles auth queries and real-time polling |
| React Hook Form | 7.x | Complex form state with dynamic arrays | Already installed, useFieldArray handles date/participant lists |
| Zod | 3.x | Schema validation | Already installed, validates event creation forms |
| shadcn/ui Combobox | Latest | Searchable participant selection | Radix Popover + Command, WAI-ARIA accessible, standard pattern |
| shadcn/ui Data Table | Latest | Participant list management | TanStack Table wrapper, sortable/filterable |
| shadcn/ui Calendar | Latest | Multi-date event selection | React DayPicker wrapper, supports multi-select mode |
| shadcn/ui Date Picker | Latest | Individual date input fields | Popover + Calendar composition |
| TanStack Table | 8.x | Headless table logic | Industry standard for data tables, full TypeScript support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | Latest | Date formatting and manipulation | Already used by shadcn/ui Date Picker, French locale support |
| MSW (Mock Service Worker) | 2.x | Mock SIMV registry API | Development only, intercepts network requests |
| @faker-js/faker | 8.x | Generate mock participant data | Development only, realistic test data |
| Zustand | 5.x | Client-side UI state (optional) | Only if form state gets complex beyond React Hook Form |
| cmdk | Latest | Command palette component | Underlying library for shadcn/ui Command component |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn/ui Combobox | react-select | Combobox is unstyled Radix primitives, react-select has opinionated styles harder to customize |
| TanStack Table | AG Grid / react-table v7 | AG Grid is paid for advanced features, react-table v7 is deprecated (TanStack Table is v8) |
| MSW | JSON Server | MSW intercepts at network level (works in tests), JSON Server requires separate server process |
| React Router auth | NextAuth.js | NextAuth is for Next.js, we're using Vite + React + Payload auth |
| Polling with refetchInterval | WebSockets | WebSockets add complexity for infrequent updates, polling is simpler for 1-10 organizers |

**Installation:**

Frontend dependencies (already have most from Phase 2):
```bash
cd /workspace/frontend

# Table management (new)
npm install @tanstack/react-table

# Date handling (new)
npm install date-fns

# Command palette for Combobox (new)
npx shadcn@latest add command
npx shadcn@latest add popover
npx shadcn@latest add calendar

# Development mocking (new, dev-only)
npm install -D msw @faker-js/faker

# Optional state management
npm install zustand  # only if needed
```

Backend (no new dependencies needed):
- Payload auth already configured in Phase 1
- Access control helpers already exist (`organizerScoped`, `isAdmin`)

## Architecture Patterns

### Recommended Project Structure

Frontend (`/workspace/frontend`):
```
frontend/src/
├── pages/
│   ├── SignPage.tsx              # Existing: Phase 2 public signing
│   ├── SuccessPage.tsx           # Existing: Phase 2 confirmation
│   ├── LoginPage.tsx             # NEW: Organizer login
│   ├── DashboardPage.tsx         # NEW: Event list (organizer's events)
│   ├── EventCreatePage.tsx       # NEW: Create/edit event form
│   └── EventDetailPage.tsx       # NEW: Real-time attendance view
├── components/
│   ├── ui/                       # Existing: shadcn/ui components
│   ├── SignatureCanvas.tsx       # Existing: Phase 2
│   ├── ParticipantForm.tsx       # Existing: Phase 2
│   ├── ProtectedRoute.tsx        # NEW: Auth wrapper component
│   ├── EventForm.tsx             # NEW: Multi-step event creation
│   ├── DateSelector.tsx          # NEW: Multi-date picker with useFieldArray
│   ├── ParticipantSearch.tsx     # NEW: Combobox for SIMV search
│   ├── ParticipantTable.tsx      # NEW: Data table for participant list
│   └── AttendanceDashboard.tsx   # NEW: Real-time signing status
├── contexts/
│   └── AuthContext.tsx           # NEW: User auth state (from /api/users/me)
├── hooks/
│   ├── use-signature-submission.ts   # Existing: Phase 2 mutation
│   ├── use-auth.ts               # NEW: Login, logout, auth state
│   ├── use-events.ts             # NEW: CRUD operations for events
│   ├── use-participants.ts       # NEW: Search SIMV, add/remove participants
│   └── use-attendance.ts         # NEW: Real-time polling for dashboard
├── lib/
│   ├── api.ts                    # Existing: Payload REST client
│   ├── utils.ts                  # Existing: cn() helper
│   ├── schemas.ts                # Existing: Zod schemas
│   └── auth.ts                   # NEW: Auth helpers (checkAuth, redirectToLogin)
├── mocks/
│   ├── handlers.ts               # NEW: MSW request handlers
│   ├── data.ts                   # NEW: Mock SIMV registry generator
│   └── browser.ts                # NEW: MSW browser setup
├── App.tsx
└── main.tsx
```

Backend structure (no changes needed):
```
backend/src/
├── collections/
│   ├── Events.ts                 # EXISTING: organizerScoped access already set
│   ├── AttendanceDays.ts         # EXISTING: system-created, read-only
│   ├── Participants.ts           # EXISTING: public create for Phase 2
│   └── Users.ts                  # EXISTING: auth enabled
├── access/
│   ├── organizerScoped.ts        # EXISTING: user.createdBy filtering
│   └── isAdmin.ts                # EXISTING: admin-only access
└── hooks/
    └── events/
        └── afterChange.ts        # EXISTING: auto-creates AttendanceDays
```

### Pattern 1: Payload CMS Authentication (Frontend)

**What:** Authenticate against Payload's built-in auth endpoints and maintain session via HTTP-only cookies.

**When to use:** All organizer-facing pages that require authentication.

**How it works:** Payload CMS sets HTTP-only cookies automatically on successful login. Frontend checks auth state by calling `/api/users/me` and wraps protected routes in an auth context.

**Example:**

```typescript
// frontend/src/hooks/use-auth.ts
// Source: https://payloadcms.com/docs/authentication/operations
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface User {
  id: string
  email: string
  role: 'admin' | 'organizer'
  firstName: string
  lastName: string
}

// Check current auth state via /api/users/me
export function useAuth() {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/users/me', {
        credentials: 'include', // CRITICAL: send HTTP-only cookies
      })
      if (!res.ok) return null
      const data = await res.json()
      return data.user || null
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // CRITICAL: receive HTTP-only cookies
        body: JSON.stringify(credentials),
      })
      if (!res.ok) throw new Error('Login failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Logout failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null)
    },
  })

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
  }
}
```

```typescript
// frontend/src/components/ProtectedRoute.tsx
// Source: https://ui.dev/react-router-protected-routes-authentication
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

```typescript
// frontend/src/App.tsx
import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/sign/:dayId/:sessionId" element={<SignPage />} />
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected organizer routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/new"
        element={
          <ProtectedRoute>
            <EventCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:id"
        element={
          <ProtectedRoute>
            <EventDetailPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
```

**Security notes:**
- HTTP-only cookies prevent XSS attacks (JavaScript can't read token)
- Always use `credentials: 'include'` in fetch calls to send cookies
- Payload handles CSRF protection automatically
- No need to manually store JWT in localStorage (security risk)

### Pattern 2: Dynamic Date Selection with useFieldArray

**What:** Multi-date picker where users can select non-consecutive dates for multi-day events, using React Hook Form's useFieldArray.

**When to use:** Event creation form's date selection step.

**How it works:** useFieldArray manages an array of `{ date: Date }` objects, allowing add/remove operations while maintaining React Hook Form's validation state.

**Example:**

```typescript
// frontend/src/components/DateSelector.tsx
// Source: https://react-hook-form.com/docs/usefieldarray
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export function DateSelector() {
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'selectedDates',
    // CRITICAL: keyName defaults to 'id' — don't use index as key
  })

  const handleDateSelect = (date: Date) => {
    // Check if date already exists
    const exists = fields.some((field) => {
      const fieldDate = new Date(field.date)
      return fieldDate.toDateString() === date.toDateString()
    })

    if (!exists) {
      // CRITICAL: Must pass object, not primitive value
      append({ date: date.toISOString() })
    }
  }

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        onSelect={(date) => date && handleDateSelect(date)}
        locale={fr}
      />

      <div className="space-y-2">
        <h3>Dates selectionnees:</h3>
        {fields.length === 0 && <p className="text-muted">Aucune date selectionnee</p>}
        {fields.map((field, index) => (
          // CRITICAL: Use field.id as key, NOT index
          <div key={field.id} className="flex items-center gap-2">
            <span>{format(new Date(field.date), 'PPP', { locale: fr })}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(index)}
            >
              Supprimer
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Pitfalls to avoid:**
- **NEVER use array index as key** — use `field.id` (auto-generated by useFieldArray)
- **NEVER append primitives** — must be `append({ date: value })`, not `append(value)`
- **NEVER stack actions** — don't call `append()` then immediately `remove()` in same render
- **NEVER have multiple useFieldArray with same name** — each must be unique

### Pattern 3: Searchable Combobox for Participant Selection

**What:** Autocomplete search input with dropdown suggestions, using shadcn/ui Combobox (Popover + Command pattern).

**When to use:** SIMV registry search, adding participants to event.

**How it works:** Command component provides fuzzy search/filtering, Popover provides dropdown positioning, combined into accessible combobox pattern.

**Example:**

```typescript
// frontend/src/components/ParticipantSearch.tsx
// Source: https://ui.shadcn.com/docs/components/radix/combobox
import { useState } from 'react'
import { Check, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Participant {
  id: string
  lastName: string
  firstName: string
  professionalNumber?: string
  beneficiaryType: string
}

export function ParticipantSearch({
  onSelect,
}: {
  onSelect: (participant: Participant) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Mock SIMV search (replace with real API in production)
  const { data: results = [], isLoading } = useParticipantSearch(search)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <Search className="mr-2 h-4 w-4" />
          Rechercher dans le registre SIMV...
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder="Nom ou numero d'inscription..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Recherche...' : 'Aucun resultat trouve'}
            </CommandEmpty>
            <CommandGroup>
              {results.map((participant) => (
                <CommandItem
                  key={participant.id}
                  value={participant.id}
                  onSelect={() => {
                    onSelect(participant)
                    setOpen(false)
                    setSearch('')
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      'invisible' // Show when selected
                    )}
                  />
                  <div className="flex flex-col">
                    <span>
                      {participant.lastName} {participant.firstName}
                    </span>
                    {participant.professionalNumber && (
                      <span className="text-sm text-muted-foreground">
                        {participant.professionalNumber}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

**Accessibility notes:**
- Combobox uses `role="combobox"` and `aria-expanded`
- Command component handles keyboard navigation automatically
- Uses `aria-activedescendant` pattern for screen readers

### Pattern 4: Data Table with TanStack Table

**What:** Sortable, filterable table for managing participant lists with add/remove actions.

**When to use:** Displaying and managing pre-populated participant lists.

**How it works:** TanStack Table provides headless table logic, shadcn/ui provides styled table components, combine for full-featured data table.

**Example:**

```typescript
// frontend/src/components/ParticipantTable.tsx
// Source: https://ui.shadcn.com/docs/components/radix/data-table
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface Participant {
  id: string
  lastName: string
  firstName: string
  email: string
  beneficiaryType: string
}

const columns: ColumnDef<Participant>[] = [
  {
    accessorKey: 'lastName',
    header: 'Nom',
  },
  {
    accessorKey: 'firstName',
    header: 'Prenom',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'beneficiaryType',
    header: 'Type',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Handle remove
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    },
  },
]

export function ParticipantTable({ data }: { data: Participant[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Aucun participant
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

### Pattern 5: Real-Time Attendance Dashboard (Polling)

**What:** Live view of who has signed, updated automatically via polling.

**When to use:** Event detail page showing current attendance status.

**How it works:** TanStack Query's `refetchInterval` option polls backend every N seconds, automatically updating UI with latest signatures.

**Example:**

```typescript
// frontend/src/hooks/use-attendance.ts
// Source: https://tanstack.com/query/v5/docs/react/guides/important-defaults
import { useQuery } from '@tanstack/react-query'

export function useAttendanceDashboard(eventId: string) {
  return useQuery({
    queryKey: ['attendance', eventId],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventId}/attendance`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to fetch attendance')
      return res.json()
    },
    // Poll every 10 seconds for real-time updates
    refetchInterval: 10000,
    // Continue polling in background when tab is inactive
    refetchIntervalInBackground: true,
    // Keep data fresh
    staleTime: 5000,
  })
}
```

```typescript
// frontend/src/components/AttendanceDashboard.tsx
import { useAttendanceDashboard } from '@/hooks/use-attendance'

export function AttendanceDashboard({ eventId }: { eventId: string }) {
  const { data, isLoading } = useAttendanceDashboard(eventId)

  if (isLoading) return <div>Chargement...</div>

  return (
    <div className="space-y-4">
      <h2>Statut de presence</h2>
      {data.attendanceDays.map((day: any) => (
        <div key={day.id}>
          <h3>{day.date}</h3>
          {day.sessions.map((session: any) => (
            <div key={session.id}>
              <h4>{session.name}</h4>
              <p>
                {session.signedCount} / {session.totalParticipants} presents
              </p>
              <ul>
                {session.participants.map((p: any) => (
                  <li key={p.id}>
                    {p.lastName} {p.firstName} —{' '}
                    {p.hasSigned ? '✅ Signe' : '⏳ En attente'}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
```

**Performance notes:**
- `refetchInterval: 10000` = poll every 10 seconds (adjust based on use case)
- `refetchIntervalInBackground: true` = keep polling when tab not focused
- `staleTime: 5000` = data considered fresh for 5 seconds (reduces unnecessary refetches)
- For 10-50 participants, polling is more than adequate (WebSockets would be overkill)

### Pattern 6: Mock SIMV Registry (Development Only)

**What:** Mock participant search API using MSW (Mock Service Worker) and faker.js for realistic test data.

**When to use:** Development environment until real SIMV integration is available.

**How it works:** MSW intercepts network requests at the browser level, returns fake data matching real API contract.

**Example:**

```typescript
// frontend/src/mocks/data.ts
// Source: https://mswjs.io/ + https://fakerjs.dev/
import { faker } from '@faker-js/faker'

const beneficiaryTypes = [
  'veterinaire',
  'pharmacien',
  'asv',
  'etudiant',
  'eleveur',
  'technicien',
  'autre',
]

// Generate 100 mock veterinarians
export const mockParticipants = Array.from({ length: 100 }, () => ({
  id: faker.string.uuid(),
  lastName: faker.person.lastName(),
  firstName: faker.person.firstName(),
  email: faker.internet.email(),
  city: faker.location.city(),
  professionalNumber: faker.helpers.maybe(
    () => faker.string.numeric(8),
    { probability: 0.7 } // 70% have professional numbers
  ),
  beneficiaryType: faker.helpers.arrayElement(beneficiaryTypes),
}))
```

```typescript
// frontend/src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'
import { mockParticipants } from './data'

export const handlers = [
  // Mock SIMV search endpoint
  http.get('/api/simv/search', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')?.toLowerCase() || ''

    const results = mockParticipants.filter(
      (p) =>
        p.lastName.toLowerCase().includes(query) ||
        p.firstName.toLowerCase().includes(query) ||
        p.professionalNumber?.includes(query)
    )

    return HttpResponse.json({
      results: results.slice(0, 10), // Return max 10 results
    })
  }),
]
```

```typescript
// frontend/src/mocks/browser.ts
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

```typescript
// frontend/src/main.tsx
import { worker } from './mocks/browser'

// Enable mocking in development only
if (import.meta.env.DEV) {
  worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about non-mocked requests
  })
}
```

**Production transition:**
- MSW runs only in development (`import.meta.env.DEV`)
- Same API contract as real SIMV endpoint
- When real API is ready, remove MSW and update fetch URL
- No other code changes needed (same response shape)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication state | Custom auth context with localStorage JWT | Payload `/api/users/me` + HTTP-only cookies | HTTP-only cookies prevent XSS, Payload handles CSRF, no manual token refresh needed |
| Searchable dropdown | Custom input + filtered list + positioning | shadcn/ui Combobox (Popover + Command) | Handles keyboard nav, ARIA roles, mobile touch, fuzzy search, positioning edge cases |
| Data table sorting/filtering | Custom table with sort state | TanStack Table + shadcn/ui Table | Battle-tested sort/filter logic, TypeScript support, virtual scrolling for large datasets |
| Date picker | Custom calendar component | shadcn/ui Date Picker + Calendar | Handles locales, accessibility, keyboard nav, mobile gestures, ISO 8601 edge cases |
| Dynamic form arrays | Manual array state with useState | React Hook Form useFieldArray | Manages validation state, dirty tracking, field registration, error handling |
| Real-time updates | Manual setInterval + fetch | TanStack Query refetchInterval | Automatic refetch on window focus, retry on error, request deduplication, stale-while-revalidate |
| Mock API data | Hardcoded JSON arrays | MSW + faker.js | Intercepts network layer (works in tests), realistic random data, no separate server process |

**Key insight:** All these problems have well-tested ecosystem solutions that handle edge cases you'll discover the hard way. Authentication alone has 20+ security gotchas (CSRF, XSS, token refresh, logout race conditions) that Payload CMS already solves. Use proven patterns.

## Common Pitfalls

### Pitfall 1: useFieldArray Key Misuse

**What goes wrong:** Using array index as `key` prop instead of `field.id` causes form state corruption when items are reordered or removed.

**Why it happens:** React uses `key` to track component identity. When index is used as key, removing item 2 of 5 causes React to think items 3-5 are the removed/changed items, breaking field registration.

**How to avoid:** Always use `field.id` as key in `.map()` when rendering useFieldArray fields.

```typescript
// ❌ WRONG: Will break when removing items
{fields.map((field, index) => (
  <div key={index}>...</div>
))}

// ✅ CORRECT: Stable identity
{fields.map((field) => (
  <div key={field.id}>...</div>
))}
```

**Warning signs:** Form values "jump" between fields when removing items, validation errors appear on wrong fields, dirty state resets unexpectedly.

**Source:** [React Hook Form useFieldArray documentation](https://react-hook-form.com/docs/usefieldarray)

### Pitfall 2: Payload Auth Cookie Credentials

**What goes wrong:** Frontend fetch calls don't send HTTP-only cookies, resulting in 401 Unauthorized errors even after successful login.

**Why it happens:** `fetch()` doesn't send cookies by default for security reasons. Must explicitly opt-in with `credentials: 'include'`.

**How to avoid:** Add `credentials: 'include'` to every fetch call that needs authentication.

```typescript
// ❌ WRONG: Cookies not sent
fetch('/api/users/me')

// ✅ CORRECT: Cookies included
fetch('/api/users/me', { credentials: 'include' })
```

**Warning signs:** Login succeeds but `/api/users/me` returns 401, protected routes redirect to login immediately after login, auth state shows null user despite successful login.

**Source:** [Payload CMS Authentication Operations](https://payloadcms.com/docs/authentication/operations)

### Pitfall 3: TanStack Query Stale Data After Mutation

**What goes wrong:** After creating/updating event, dashboard still shows old data until manual refresh.

**Why it happens:** TanStack Query caches data by `queryKey`. Mutations don't automatically invalidate related queries.

**How to avoid:** Use `onSuccess` callback in mutations to invalidate affected queries.

```typescript
// ❌ WRONG: Cache not updated
const mutation = useMutation({
  mutationFn: (data) => createEvent(data),
})

// ✅ CORRECT: Invalidate events list after creation
const mutation = useMutation({
  mutationFn: (data) => createEvent(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['events'] })
  },
})
```

**Warning signs:** New events don't appear in list until page refresh, updated event shows old data in detail view, deleted events still visible in table.

**Source:** [TanStack Query Mutations](https://tanstack.com/query/v5/docs/react/guides/mutations)

### Pitfall 4: useFieldArray Stacking Actions

**What goes wrong:** Calling `append()` immediately followed by `remove()` or multiple rapid `append()` calls causes state desync, with some operations getting lost.

**Why it happens:** useFieldArray operations are async under the hood. Stacking calls before previous completes causes race conditions.

**How to avoid:** Never chain useFieldArray operations in same function. Wait for user interaction between operations.

```typescript
// ❌ WRONG: Stacked operations
function handleSwap(index: number) {
  const temp = fields[index]
  remove(index)
  append(temp) // Race condition
}

// ✅ CORRECT: Use swap method
function handleSwap(fromIndex: number, toIndex: number) {
  swap(fromIndex, toIndex)
}
```

**Warning signs:** Array operations occasionally "disappear", form state gets out of sync with UI, validation errors for non-existent fields.

**Source:** [React Hook Form useFieldArray - Rare bugs](https://hackmd.io/@linfini/HJnyrm0Dge)

### Pitfall 5: Calendar Multi-Select State Management

**What goes wrong:** Selected dates in calendar don't stay highlighted after selection, or selecting same date twice doesn't deselect it.

**Why it happens:** shadcn/ui Calendar in `mode="single"` doesn't maintain selection state — that's your responsibility. Need to track selected dates separately.

**How to avoid:** Maintain selected dates array in form state, pass to Calendar as `selected` prop (for highlights), check before adding to prevent duplicates.

```typescript
// ❌ WRONG: Calendar doesn't track selections
<Calendar
  mode="single"
  onSelect={(date) => append({ date })}
/>

// ✅ CORRECT: Track selections in form state
const selectedDates = fields.map(f => new Date(f.date))
<Calendar
  mode="single"
  selected={selectedDates} // Highlight selected dates
  onSelect={(date) => {
    if (!selectedDates.some(d => d.toDateString() === date.toDateString())) {
      append({ date: date.toISOString() })
    }
  }}
/>
```

**Warning signs:** Calendar shows no selected dates, clicking same date multiple times adds duplicates, selected dates disappear after re-render.

**Source:** [shadcn/ui Calendar documentation](https://ui.shadcn.com/docs/components/radix/calendar)

### Pitfall 6: MSW Handler Path Matching

**What goes wrong:** MSW handlers don't intercept requests, mocked API calls still hit real backend (404s or wrong data).

**Why it happens:** MSW path matching is exact by default. If your code calls `/api/simv/search?q=test` but handler is `/api/simv/search` (no query params), it won't match.

**How to avoid:** Use MSW's `http.get()` with base path only (query params accessed via `request.url`), or use path patterns with wildcards.

```typescript
// ❌ WRONG: Query params in path
http.get('/api/simv/search?q=test', () => ...)

// ✅ CORRECT: Base path only
http.get('/api/simv/search', ({ request }) => {
  const url = new URL(request.url)
  const query = url.searchParams.get('q')
  // ...
})
```

**Warning signs:** MSW console logs show "worker started" but requests not intercepted, network tab shows requests going to real server, mock data never appears in UI.

**Source:** [MSW API mocking documentation](https://mswjs.io/)

### Pitfall 7: Organizer-Scoped Access in Frontend

**What goes wrong:** Organizer sees all events (including other organizers' events), or gets 403 errors when viewing own events.

**Why it happens:** Backend `organizerScoped` access control filters by `createdBy`. If frontend doesn't send credentials or event wasn't created by current user, access fails.

**How to avoid:** Always include `credentials: 'include'` in requests, ensure event creation associates `createdBy` (already handled by Phase 1 backend hook).

```typescript
// Backend already handles this in Events collection:
// access: { read: organizerScoped }

// Frontend just needs to send credentials:
fetch('/api/events', { credentials: 'include' })

// Payload automatically filters response to only user's events
```

**Warning signs:** Event list is empty despite creating events, 403 errors when accessing event detail, all events visible to all organizers.

**Source:** Backend implementation in `/workspace/backend/src/access/organizerScoped.ts`

## Code Examples

Verified patterns from official sources.

### Complete Event Creation Form (Multi-Step)

```typescript
// frontend/src/components/EventForm.tsx
// Combines: React Hook Form + useFieldArray + Zod + shadcn/ui
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { DateSelector } from '@/components/DateSelector'

const eventSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  location: z.string().min(1, 'Lieu requis'),
  organizerName: z.string().min(1, 'Nom organisateur requis'),
  organizerEmail: z.string().email('Email invalide'),
  expenseType: z.enum([
    'hospitality_snack',
    'hospitality_catering',
    'hospitality_accommodation',
    'event_registration',
    'meeting_organization',
    'transport',
  ]),
  selectedDates: z
    .array(
      z.object({
        date: z.string(), // ISO date string
      })
    )
    .min(1, 'Au moins une date requise'),
})

type EventFormData = z.infer<typeof eventSchema>

export function EventForm() {
  const methods = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      selectedDates: [],
    },
  })

  const { register, handleSubmit, formState: { errors } } = methods

  const onSubmit = (data: EventFormData) => {
    // Submit to Payload API
    console.log(data)
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="title">Titre de l'evenement</label>
          <input {...register('title')} />
          {errors.title && <p>{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="location">Lieu</label>
          <input {...register('location')} />
          {errors.location && <p>{errors.location.message}</p>}
        </div>

        <div>
          <label>Type de depense</label>
          <select {...register('expenseType')}>
            <option value="hospitality_snack">Hospitalite - Collation</option>
            <option value="hospitality_catering">
              Hospitalite - Restauration
            </option>
            <option value="hospitality_accommodation">
              Hospitalite - Hebergement
            </option>
            <option value="event_registration">
              Frais d'inscription evenement
            </option>
            <option value="meeting_organization">
              Frais de reunion/organisation
            </option>
            <option value="transport">Frais de transport</option>
          </select>
        </div>

        <DateSelector />

        <Button type="submit">Creer l'evenement</Button>
      </form>
    </FormProvider>
  )
}
```

### TanStack Query Event CRUD Hooks

```typescript
// frontend/src/hooks/use-events.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface Event {
  id: string
  title: string
  location: string
  organizerName: string
  organizerEmail: string
  expenseType: string
  selectedDates: Array<{ date: string }>
}

export function useEvents() {
  return useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch('/api/events', {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to fetch events')
      const data = await res.json()
      return data.docs // Payload wraps results in { docs: [...] }
    },
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<Event, 'id'>) => {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create event')
      return res.json()
    },
    onSuccess: () => {
      // Invalidate events list to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useEvent(id: string) {
  return useQuery<Event>({
    queryKey: ['events', id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to fetch event')
      return res.json()
    },
    enabled: !!id, // Only fetch if id is provided
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-table v7 | TanStack Table v8 | 2023 | Renamed package, improved TypeScript support, better tree-shaking |
| Tailwind PostCSS | Tailwind Vite plugin (@tailwindcss/vite) | 2024 (v4) | Faster builds, better HMR, no postcss.config.js needed |
| Redux for all state | TanStack Query (server) + Zustand/Context (client) | 2024-2026 | Separation of concerns, less boilerplate, better caching |
| Custom auth with JWT in localStorage | HTTP-only cookies + /api/users/me | Ongoing | Prevents XSS attacks, automatic CSRF protection |
| Faker.js (original) | @faker-js/faker | 2022 | Original project archived, community fork is maintained |
| WebSockets for real-time | Polling with refetchInterval | Context-dependent | Simpler for low-frequency updates, fewer moving parts |

**Deprecated/outdated:**
- **react-table v7**: Renamed to TanStack Table, v7 is deprecated as of 2023
- **Tailwind CSS v3**: v4 uses Vite plugin instead of PostCSS (breaking change)
- **Redux Toolkit + RTK Query**: Still valid but overkill for most apps, TanStack Query is lighter and more focused
- **faker (original npm package)**: Archived in 2022, use `@faker-js/faker` fork instead
- **NextAuth.js for non-Next.js apps**: Designed for Next.js, use native auth for Vite/CRA/etc

## Open Questions

### 1. **Real SIMV Registry Integration**
- What we know: Requirements say "mock SIMV registry search by name or registration number"
- What's unclear: What is the real SIMV API contract? Is it REST or SOAP? How does pagination work? What fields are available?
- Recommendation: Use MSW + faker.js for Phase 3, plan Phase 4/5 for real integration. Mock should match real API shape as much as possible (get sample response from client).

### 2. **Event Status Workflow Transitions**
- What we know: Events transition through "draft → open → finalized" statuses
- What's unclear: What triggers each transition? Can organizer manually move between states, or is it automatic (e.g., open when first signature arrives)? Can finalized events be edited?
- Recommendation: Implement manual status select in event form for Phase 3, add validation rules in Phase 4 if needed (e.g., can't finalize if no signatures).

### 3. **Walk-In Participant Flow**
- What we know: PART-04 says "organizer can add walk-in participants on-site during the event"
- What's unclear: Is this a separate UI flow from pre-populated list? Do walk-ins skip SIMV search? Are walk-ins added to Participants collection or just ad-hoc entries?
- Recommendation: Implement as "quick add" form on attendance dashboard that creates Participant record without SIMV search, adds to session immediately.

### 4. **Attendance Dashboard Backend Endpoint**
- What we know: Need real-time view of who has signed
- What's unclear: Does backend provide aggregated endpoint (e.g., `/api/events/:id/attendance`) or should frontend query multiple collections (Event → AttendanceDays → Sessions → Signatures)?
- Recommendation: For Phase 3, frontend can query existing collections and aggregate client-side. Add dedicated endpoint in Phase 4 if performance suffers.

### 5. **Date Range vs. Selected Dates**
- What we know: Requirements mention "date range (from/to)" and Phase 1 implemented `selectedDates` array for non-consecutive dates
- What's unclear: Should UI support both range picker AND individual date selection, or just multi-select calendar?
- Recommendation: Use multi-select calendar only (supports both use cases: consecutive dates via shift-click, non-consecutive via individual clicks). Matches Phase 1 data model.

## Sources

### Primary (HIGH confidence)

- [Payload CMS Authentication Operations](https://payloadcms.com/docs/authentication/operations) - Login, logout, me, refresh endpoints
- [Payload CMS JWT Strategy](https://payloadcms.com/docs/authentication/jwt) - HTTP-only cookies, token refresh
- [React Hook Form useFieldArray](https://react-hook-form.com/docs/usefieldarray) - Dynamic form arrays, key usage, pitfalls
- [TanStack Query Mutations](https://tanstack.com/query/v5/docs/react/guides/mutations) - Mutation patterns, cache invalidation
- [TanStack Query Optimistic Updates](https://tanstack.com/query/v5/docs/react/guides/optimistic-updates) - onMutate pattern, rollback
- [shadcn/ui Combobox](https://ui.shadcn.com/docs/components/radix/combobox) - Popover + Command pattern
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/radix/data-table) - TanStack Table wrapper
- [shadcn/ui Calendar](https://ui.shadcn.com/docs/components/radix/calendar) - Multi-select, React DayPicker
- [MSW Official Docs](https://mswjs.io/) - Network-level mocking, browser setup

### Secondary (MEDIUM confidence)

- [React Router Protected Routes](https://ui.dev/react-router-protected-routes-authentication) - Context-based auth pattern
- [TanStack Query Auto Refetching](https://tanstack.com/query/v4/docs/framework/react/examples/auto-refetching) - refetchInterval examples
- [React Hook Form Dynamic Forms](https://refine.dev/blog/dynamic-forms-in-react-hook-form/) - useFieldArray use cases
- [Zustand State Management](https://github.com/pmndrs/zustand) - Lightweight client state
- [@faker-js/faker Documentation](https://fakerjs.dev/) - Mock data generation
- [TanStack Table v8 Documentation](https://tanstack.com/table/v8/docs/guide/introduction) - Headless table library

### Tertiary (LOW confidence - community sources, needs verification)

- [React Hook Form useFieldArray Pitfalls (Medium)](https://medium.com/@granthgharewal/%EF%B8%8F-react-hook-forms-usefieldarray-silently-overwrites-your-id-here-s-how-to-fix-it-e14b228a504d) - ID field conflicts
- [Concurrent Optimistic Updates (TkDodo blog)](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query) - Advanced patterns
- [Multi-Step Forms in React (Medium)](https://medium.com/@vandanpatel29122001/react-building-a-multi-step-form-with-wizard-pattern-85edec21f793) - Wizard patterns
- [MSW + Faker Integration (Medium)](https://medium.com/admitad-tech/mocks-without-roadblocks-the-magic-of-mswjs-faker-js-306541458c2a) - Development mocking

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official docs and existing Phase 2 installation
- Architecture patterns: MEDIUM-HIGH - Payload auth and React Router patterns verified, some patterns inferred from common practices
- Access control: HIGH - Backend implementations already exist in codebase, verified by reading source files
- Pitfalls: MEDIUM - Sourced from official docs + community issues, some are well-documented (useFieldArray keys), others are experiential

**Research date:** 2026-02-13
**Valid until:** 2026-03-15 (30 days - ecosystem is relatively stable)

**Notes:**
- Phase 2 already installed most dependencies (React Hook Form, TanStack Query, shadcn/ui base)
- Backend access control already implemented in Phase 1 (organizerScoped, isAdmin)
- No CONTEXT.md exists — all implementation decisions at Claude's discretion
- Real SIMV integration deferred — mock with MSW for Phase 3
