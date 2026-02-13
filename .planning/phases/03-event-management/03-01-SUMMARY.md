---
phase: 03-event-management
plan: 01
subsystem: event-management
tags: [backend, frontend, schema, dependencies, mocking]
dependency_graph:
  requires: [01-foundation-data-model, 02-public-signature-flow]
  provides: [event-status-workflow, participant-prepopulation, msw-mocking]
  affects: [Events, frontend-ui-components]
tech_stack:
  added:
    - "@tanstack/react-table@^8.25.3"
    - "date-fns@^5.1.0"
    - "msw@^2.8.5"
    - "@faker-js/faker@^9.3.0"
    - "shadcn/ui components: table, badge, calendar, popover, command, dropdown-menu"
  patterns:
    - "Status workflow with transition validation"
    - "MSW mock service worker for dev-only API mocking"
    - "Conditional dynamic imports for dev dependencies"
key_files:
  created:
    - frontend/src/mocks/data.ts
    - frontend/src/mocks/handlers.ts
    - frontend/src/mocks/browser.ts
    - frontend/public/mockServiceWorker.js
    - frontend/src/components/ui/table.tsx
    - frontend/src/components/ui/badge.tsx
    - frontend/src/components/ui/calendar.tsx
    - frontend/src/components/ui/popover.tsx
    - frontend/src/components/ui/command.tsx
    - frontend/src/components/ui/dropdown-menu.tsx
    - frontend/src/components/ui/dialog.tsx
  modified:
    - backend/src/collections/Events.ts
    - frontend/src/main.tsx
    - frontend/package.json
decisions:
  - id: 03-01-01
    summary: "Status field prevents invalid transitions via beforeChange hook"
    rationale: "Business rule enforcement at data layer prevents UI bugs and ensures state integrity. Finalized events cannot be reopened (Phase 6 will add controlled reopen feature)."
    alternatives: "UI-only validation (rejected - not enforceable), optimistic validation (rejected - race conditions)"
  - id: 03-01-02
    summary: "MSW mocks SIMV registry with 100 French participants"
    rationale: "Enables full participant search development without real SIMV API. Faker generates realistic French data (names, cities). 70% of participants have professional numbers matching SIMV distribution."
    alternatives: "Hardcoded JSON (rejected - not realistic), Mirage.js (rejected - heavier than MSW)"
  - id: 03-01-03
    summary: "MSW service worker loads conditionally via dynamic import in dev only"
    rationale: "Prevents MSW from being bundled in production. Vite tree-shakes unused imports. Service worker setup must complete before React renders (Promise.then pattern)."
    alternatives: "Environment variable checks (rejected - still bundles code), separate dev entry point (rejected - complicates tooling)"
metrics:
  duration: "4 minutes"
  tasks_completed: 2
  files_created: 14
  files_modified: 4
  commits: 2
  completed_at: "2026-02-13T21:12:40Z"
---

# Phase 03 Plan 01: Foundation Setup Summary

**One-liner:** Added event status workflow (draft/open/finalized) with transition validation, installed Phase 3 frontend dependencies (@tanstack/react-table, date-fns, msw, faker), added 6 shadcn/ui components, and created MSW mock SIMV registry with 100 French participants.

## What Was Built

### Backend Changes

**Events Collection Schema Updates:**
- Added `status` field with three states: draft (default), open, finalized
- Added `participants` hasMany relationship to pre-populate expected participants
- Implemented status transition validation via beforeChange hook:
  - Prevents open → draft transition (error: "Un evenement ouvert ne peut pas revenir en brouillon")
  - Prevents finalized → draft/open transitions (error: "Un evenement finalise ne peut pas etre modifie")
  - Allows draft → open, draft → finalized, open → finalized

### Frontend Infrastructure

**Dependencies Installed:**
- `@tanstack/react-table` - Advanced table management for participant lists
- `date-fns` - Date formatting and manipulation
- `msw` - Mock Service Worker for dev-only API mocking
- `@faker-js/faker` - Generate realistic French test data

**shadcn/ui Components Added:**
- `table` - Base table components for data display
- `badge` - Status badges for event states
- `calendar` - Date picker for event management
- `popover` - Floating UI for filters/actions
- `command` - Command palette pattern
- `dropdown-menu` - Action menus for rows

**MSW Mock SIMV Registry:**
- Created `mockParticipants` with 100 French participants
- Fields: id, lastName, firstName, email, city, professionalNumber (70% have one), beneficiaryType
- Search handler at `/api/simv/search` filters by name or professional number
- Returns max 10 results per query
- Conditionally loaded only in dev mode via dynamic import
- Service worker initialized in `public/mockServiceWorker.js`

## Deviations from Plan

None - plan executed exactly as written.

## Technical Details

### Status Transition Logic

The beforeChange hook validates status transitions only when:
1. Operation is `update` (not create)
2. Status field exists in data
3. Original document has a status
4. Status value is actually changing

This prevents unnecessary validation overhead and allows status to be set on creation without checks.

### MSW Integration Pattern

```typescript
async function enableMocking() {
  if (!import.meta.env.DEV) return
  const { worker } = await import('./mocks/browser')
  return worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  // React app renders after MSW starts
})
```

This ensures:
- MSW worker starts before React renders
- Production builds exclude MSW code entirely (tree-shaken)
- Unhandled requests bypass MSW (only `/api/simv/search` is mocked)

### Mock Data Characteristics

- French locale (cities, names)
- 8-digit professional numbers (SIMV format)
- 7 beneficiary types matching backend enum
- Realistic email addresses
- Case-insensitive search across lastName, firstName, professionalNumber

## Verification Results

All verification checks passed:
- ✅ `cd /workspace/backend && npx tsc --noEmit` - No TypeScript errors
- ✅ `cd /workspace/frontend && npx tsc --noEmit` - No TypeScript errors
- ✅ `cd /workspace/frontend && npx vite build` - Production build succeeds
- ✅ Events.ts contains `status` field with draft/open/finalized options
- ✅ Events.ts contains `participants` relationship to participants collection
- ✅ All 6 shadcn/ui components created in `frontend/src/components/ui/`
- ✅ All 3 mock files created in `frontend/src/mocks/`
- ✅ main.tsx conditionally starts MSW worker in dev mode

## Commits

1. **390ca7a** - `feat(03-01): add status field and participants relationship to Events`
   - Modified: `backend/src/collections/Events.ts`
   - Added status field, participants relationship, transition validation

2. **102c54e** - `feat(03-01): install Phase 3 dependencies, add shadcn components, set up MSW mock`
   - Modified: `frontend/package.json`, `frontend/src/main.tsx`
   - Created: 14 new files (mocks, UI components, service worker)

## Next Steps

This plan provides the foundation for:
- **03-02**: Event creation form with status workflow
- **03-03**: Participant search and pre-population UI using MSW mock
- **03-04**: Event list dashboard with status badges and filters
- Future plans can now use @tanstack/react-table for participant lists, date-fns for date formatting, and rely on working MSW mock for participant search development

## Self-Check: PASSED

**Created files verification:**
```bash
✓ FOUND: /workspace/frontend/src/mocks/data.ts
✓ FOUND: /workspace/frontend/src/mocks/handlers.ts
✓ FOUND: /workspace/frontend/src/mocks/browser.ts
✓ FOUND: /workspace/frontend/public/mockServiceWorker.js
✓ FOUND: /workspace/frontend/src/components/ui/table.tsx
✓ FOUND: /workspace/frontend/src/components/ui/badge.tsx
✓ FOUND: /workspace/frontend/src/components/ui/calendar.tsx
✓ FOUND: /workspace/frontend/src/components/ui/popover.tsx
✓ FOUND: /workspace/frontend/src/components/ui/command.tsx
✓ FOUND: /workspace/frontend/src/components/ui/dropdown-menu.tsx
✓ FOUND: /workspace/frontend/src/components/ui/dialog.tsx
```

**Modified files verification:**
```bash
✓ FOUND: /workspace/backend/src/collections/Events.ts (status + participants fields present)
✓ FOUND: /workspace/frontend/src/main.tsx (enableMocking function present)
```

**Commits verification:**
```bash
✓ FOUND: 390ca7a (Task 1 - Events schema updates)
✓ FOUND: 102c54e (Task 2 - Frontend dependencies and MSW)
```

All claimed artifacts exist and commits are in repository history.
