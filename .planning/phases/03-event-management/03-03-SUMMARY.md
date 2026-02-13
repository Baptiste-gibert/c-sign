---
phase: 03-event-management
plan: 03
subsystem: event-management
tags: [frontend, event-creation, event-list, forms, tanstack-query]
dependency_graph:
  requires: [03-01, 03-02]
  provides: [event-crud-ui, event-dashboard, multi-date-selection]
  affects: [frontend/src/pages/*, frontend/src/hooks/*, frontend/src/components/*]
tech_stack:
  added:
    - TanStack Query event CRUD hooks
    - React Hook Form useFieldArray for multi-date selection
    - date-fns French locale formatting
  patterns:
    - Multi-date calendar picker with useFieldArray
    - Controller pattern for shadcn/ui Select with React Hook Form
    - Pre-filled form fields from auth context
    - Optimistic UI updates via TanStack Query cache invalidation
key_files:
  created:
    - frontend/src/hooks/use-events.ts
    - frontend/src/components/DateSelector.tsx
    - frontend/src/components/EventForm.tsx
  modified:
    - frontend/src/lib/schemas.ts
    - frontend/src/pages/DashboardPage.tsx
    - frontend/src/pages/EventCreatePage.tsx
decisions:
  - id: 03-03-01
    summary: "DateSelector uses Calendar modifiers for visual feedback instead of controlled selected prop"
    rationale: "react-day-picker v9 supports mode='single' with custom modifiers for highlighting multiple dates. This allows click-to-add interaction while showing all selected dates visually."
    alternatives: "mode='multiple' (rejected - less control over selection logic), lift state to parent (rejected - violates form encapsulation)"
  - id: 03-03-02
    summary: "useFieldArray fields keyed by field.id not index"
    rationale: "React Hook Form requires stable keys for array fields. Using field.id prevents re-render bugs when removing items from middle of array."
    alternatives: "Use index as key (rejected - causes React re-render issues), use date string as key (rejected - not guaranteed unique)"
  - id: 03-03-03
    summary: "Expense type Select uses Controller wrapper not register()"
    rationale: "shadcn/ui Select is not a native HTML select - uses Radix UI with value/onValueChange props. Controller bridges React Hook Form to custom components."
    alternatives: "Custom register wrapper (rejected - reinventing Controller), native select (rejected - inconsistent UI)"
metrics:
  duration_seconds: 189
  duration_minutes: 3
  completed_at: "2026-02-13T21:22:27Z"
  tasks_completed: 2
  files_created: 3
  files_modified: 3
  commits: 2
---

# Phase 03 Plan 03: Event Creation and Dashboard Summary

**One-liner:** Full event creation form with multi-date calendar picker and event list dashboard with status badges, enabling organizers to create and view events.

## What Was Built

### Event CRUD Infrastructure (Task 1)

**TanStack Query Hooks (`use-events.ts`):**
- `useEvents()` - Fetches event list sorted by createdAt descending, returns docs array from Payload response
- `useCreateEvent(options)` - Creates event via POST /api/events, accepts onSuccess callback for navigation
- `useEvent(id)` - Fetches single event with depth=1 (populates attendanceDays), enabled only when id exists
- `useUpdateEvent(id)` - Updates event via PATCH, invalidates both list and detail queries
- All hooks use `credentials: 'include'` for HTTP-only cookie auth
- TypeScript interfaces: `PayloadEvent`, `PayloadEventsResponse`, `PayloadEventResponse`

**Event Validation Schema (`schemas.ts`):**
- Added `eventSchema` with Zod validation
- Fields: title (1-200 chars), location, organizerName, organizerEmail (email validation), expenseType (enum of 6 types), selectedDates (array min 1)
- Exported `EventFormData` type for form binding
- Kept existing `participantSchema` untouched

**DateSelector Component (`DateSelector.tsx`):**
- Multi-date calendar picker using shadcn/ui Calendar + React Hook Form useFieldArray
- Accesses form context via useFormContext (rendered inside FormProvider)
- Calendar in mode="single" with custom modifiers for highlighting selected dates
- Click date to add (checks for duplicates by toDateString comparison)
- Selected dates shown as badges with French formatting (date-fns PPP format with fr locale)
- Remove button (X icon) on each badge
- Empty state: "Cliquez sur le calendrier pour selectionner des dates"
- Shows validation error from formState.errors.selectedDates
- Uses field.id as key (not index) - critical for React Hook Form array stability

**EventForm Component (`EventForm.tsx`):**
- Complete event creation form using React Hook Form + zodResolver + shadcn/ui
- FormProvider wraps all fields for useFormContext access
- Pre-fills organizerName and organizerEmail from auth user context
- Fields layout in single column, max-w-2xl:
  1. Title - Input
  2. Location - Input
  3. Organizer name - Input (pre-filled)
  4. Organizer email - Input (pre-filled)
  5. Expense type - Select with Controller (6 French labels matching backend)
  6. DateSelector component
  7. Submit button with loading state
- Select uses Controller pattern (not register) - required for Radix UI components
- Field-level validation errors shown below each field in red text
- Accepts onSubmit prop and optional isSubmitting prop

### Event Pages (Task 2)

**DashboardPage (`DashboardPage.tsx`):**
- Event list dashboard - organizer's home page after login
- Header: "Mes evenements" + "Nouvel evenement" button (Plus icon, navigates to /events/new)
- Loading state: centered Loader2 spinner
- Empty state: "Aucun evenement" message + "Creez votre premier evenement" button
- Event list: shadcn/ui Table with 6 columns:
  1. Titre - clickable link to /events/{id}
  2. Lieu - location text
  3. Dates - formatted using helper function (single date formatted PPP, multiple shown as "X jours")
  4. Type de depense - French label from EXPENSE_TYPE_LABELS map
  5. Statut - StatusBadge component (Brouillon/Ouvert/Finalise)
  6. Actions - "Voir" link button
- StatusBadge helper: maps status to Badge variant (draft=secondary, open=default, finalized=outline)
- formatEventDates helper: formats dates array (1 date → PPP format, multiple → "X jours")
- EXPENSE_TYPE_LABELS constant: maps backend values to French labels (same as backend Events.ts)
- Uses useEvents() hook, useNavigate for navigation

**EventCreatePage (`EventCreatePage.tsx`):**
- Event creation page wrapping EventForm
- Header: "Nouvel evenement" with back button (ArrowLeft icon to /dashboard)
- Error handling: shows error message if creation fails
- EventForm rendered with onSubmit handler
- onSubmit: calls createEvent.mutate(data)
- On success: navigates to /events/{newEvent.id} via onSuccess callback
- Passes isSubmitting={createEvent.isPending} to form for button state
- Error display shows both generic message and specific error.message

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification checks passed:

- ✅ `cd /workspace/frontend && npx tsc --noEmit` - No TypeScript errors
- ✅ `cd /workspace/frontend && npx vite build` - Production build succeeds (9.57s)
- ✅ eventSchema exists in schemas.ts
- ✅ useEvents hook exists in use-events.ts
- ✅ DateSelector uses useFieldArray
- ✅ EventForm uses zodResolver
- ✅ DashboardPage uses useEvents hook
- ✅ DashboardPage renders Badge components for status
- ✅ EventCreatePage uses useCreateEvent hook
- ✅ EventCreatePage navigates after creation

## Technical Details

### Multi-Date Selection Pattern

DateSelector uses a controlled/uncontrolled hybrid approach:
- Calendar is uncontrolled (mode="single", no selected prop)
- useFieldArray manages form state
- Custom modifiers highlight selected dates visually
- onSelect handler checks for duplicates before appending

This prevents the Calendar from controlling which date can be selected (which would make multi-selection awkward) while still providing visual feedback.

### Form Pre-filling

EventForm accesses auth user via useAuth hook and pre-fills:
```typescript
defaultValues: {
  organizerName: user ? `${user.firstName} ${user.lastName}` : '',
  organizerEmail: user?.email || '',
}
```

This reduces organizer friction - they can override if needed but don't have to type their own info.

### Cache Invalidation

After event creation, useCreateEvent invalidates the ['events'] query:
```typescript
onSuccess: (event) => {
  queryClient.invalidateQueries({ queryKey: ['events'] })
  options?.onSuccess?.(event)
}
```

This ensures DashboardPage list refreshes automatically when navigating back - no manual refetch needed.

### Expense Type Labels Consistency

Both DashboardPage and EventForm use the exact same labels as backend Events.ts:
- Hospitalite - Collation
- Hospitalite - Restauration
- Hospitalite - Hebergement
- Frais d'inscription evenement
- Frais de reunion/organisation
- Frais de transport

This ensures UI consistency across create form, list view, and admin panel.

## Commits

| Task | Commit | Description | Files |
|------|--------|-------------|-------|
| 1 | e304933 | Create event CRUD hooks, Zod schema, DateSelector, EventForm | use-events.ts, schemas.ts, DateSelector.tsx, EventForm.tsx |
| 2 | eb5432c | Implement DashboardPage and EventCreatePage | DashboardPage.tsx, EventCreatePage.tsx |

## Success Criteria Met

All success criteria from plan achieved:

- [x] Organizer can navigate to /events/new and see event creation form
- [x] Form includes all required fields: title, location, organizer info, expense type, dates
- [x] Organizer can select expense type from 6 predefined options with French labels
- [x] Organizer can pick multiple non-consecutive dates using calendar
- [x] Form validates all fields and shows errors
- [x] Submitting form creates event via POST /api/events with credentials
- [x] After creation, organizer redirects to event detail page
- [x] Organizer sees list of events on /dashboard with all required columns
- [x] Event list shows title, location, dates, expense type, and status badges
- [x] Navigation works between dashboard and event creation
- [x] Newly created events appear in list immediately via cache invalidation

## Next Steps

**Plan 03-04** will implement the event detail page, filling the EventDetailPage stub with:
- Event metadata display (title, location, dates, status, expense type)
- Participant list table with TanStack Table (from Plan 03-01 dependencies)
- Participant search and add functionality (using MSW mock SIMV registry)
- Session breakdown by attendance day
- Status transition controls (draft → open → finalized)

**Plan 03-05** will add advanced organizer features:
- Export to XLSX with participant signatures
- Email distribution functionality
- Attendance stats and analytics
- Bulk participant operations

## Self-Check: PASSED

**Created files verification:**
```bash
✓ FOUND: /workspace/frontend/src/hooks/use-events.ts
✓ FOUND: /workspace/frontend/src/components/DateSelector.tsx
✓ FOUND: /workspace/frontend/src/components/EventForm.tsx
```

**Modified files verification:**
```bash
✓ FOUND: /workspace/frontend/src/lib/schemas.ts (eventSchema present)
✓ FOUND: /workspace/frontend/src/pages/DashboardPage.tsx (useEvents hook, Badge component)
✓ FOUND: /workspace/frontend/src/pages/EventCreatePage.tsx (useCreateEvent hook, navigate)
```

**Commits verification:**
```bash
✓ FOUND: e304933 (Task 1 - Event CRUD infrastructure)
✓ FOUND: eb5432c (Task 2 - Dashboard and EventCreate pages)
```

All claimed artifacts exist and commits are in repository history.
