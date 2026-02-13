# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** Organizers can collect legally-valid digital signatures from external participants (veterinarians, pharmacists) on any device, without requiring them to log in or install anything.
**Current focus:** Phase 3 - Event Management

## Current Position

Phase: 3 of 6 (Event Management)
Plan: 4 of 5 in current phase
Status: In Progress
Last activity: 2026-02-13 — Completed 03-04 event detail page with participant management, SIMV search, attendance dashboard, and status workflow error handling

Progress: [▓▓▓▓▓▓░░░░] 60%

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: 3 min
- Total execution time: 0.65 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01    | 3     | 23m   | 8m       |
| 02    | 3     | 9m    | 3m       |
| 03    | 4     | 12m   | 3m       |

**Recent Trend:**
- Last 5 plans: 02-03 (3m), 03-01 (4m), 03-02 (2m), 03-03 (3m), 03-04 (3m)
- Trend: Consistent 3m average on Phase 3 frontend work (forms, tables, hooks)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 1: Per-day attendance model (Event parent + AttendanceDay children) must be implemented from start — prevents data duplication and enables multi-day event tracking
- Phase 1: Signatures stored as server-side images via Payload Media collection — addresses PowerApps POC memory crash failure
- Phase 2: Public signing flow is highest priority — core product value, must work before organizer features
- 01-01: Fixed Next.js to version 15.4.11 for @payloadcms/next@3.76.1 compatibility
- 01-02: selectedDates array field supports non-consecutive multi-day events
- 01-02: Orphaned AttendanceDays preserved (not auto-deleted) when Event dates removed
- 01-02: Seven beneficiary types in alphabetical order with French labels
- 01-02: Signature uniqueness enforced via beforeChange hook (one per participant-session)
- 01-03: Payload admin files must match official template exactly — deviations cause CSS/hydration failures
- 01-03: Seed script runs via API route (`/api/seed`) not standalone tsx due to Payload 3.x compatibility
- 02-01: Tailwind v4 uses @tailwindcss/vite plugin (not PostCSS) for better performance
- 02-01: Tailwind v4 @apply directive incompatible with CSS variables — use direct CSS properties instead
- 02-01: All Phase 2 dependencies installed upfront to avoid multiple install cycles
- 02-02: Public create access for Participants/Signatures/Media enables anonymous submission
- 02-02: Public read access for AttendanceDays/Sessions allows form context loading
- 02-03: 3-step submission flow (participant -> media -> signature) preferred over single FormData with _payload
- 02-03: Imperative canvas API (isEmpty, getBlob, clear) provides cleaner validation than lifted state
- 02-03: Canvas dimensions locked on mount prevents iOS Safari blur/resize bugs
- 02-03: Auto session selection when count === 1 reduces friction for single-session events
- 03-01: Status field prevents invalid transitions via beforeChange hook — finalized events cannot be reopened (Phase 6 will add controlled reopen)
- 03-01: MSW mocks SIMV registry with 100 French participants for dev — 70% have professional numbers
- 03-01: MSW service worker loads conditionally via dynamic import in dev only — tree-shaken in production
- 03-02: HTTP-only cookies preferred over localStorage JWT — prevents XSS attacks, automatic CSRF protection
- 03-02: TanStack Query used for auth state instead of React Context — consistent with Phase 2 patterns, automatic refetching
- 03-02: OrganizerLayout wrapped inside ProtectedRoute (not outside) — layout needs auth context for user display
- 03-03: DateSelector uses Calendar modifiers for visual feedback instead of controlled selected prop — allows click-to-add with multi-date highlighting
- 03-03: useFieldArray fields keyed by field.id not index — React Hook Form requires stable keys to prevent re-render bugs
- 03-03: Expense type Select uses Controller wrapper not register() — shadcn/ui Select is Radix UI with value/onValueChange props, not native HTML
- [Phase 03-04]: SIMV search debounced at 2 chars minimum to reduce unnecessary API calls
- [Phase 03-04]: Parallel fetching via Promise.all reduces waterfall requests in attendance dashboard
- [Phase 03-04]: Status error handling parses Payload errors and displays user-friendly messages for invalid transitions

### Pending Todos

- Data model review: Sessions have no direct link to Event (must traverse Session → AttendanceDay → Event). Consider simplifying the Event > Session > AttendanceDay hierarchy before Phase 3 organizer dashboard. May also want to add Session.event convenience relationship.

### Blockers/Concerns

- Phase 2: iOS Safari signature canvas compatibility must be validated on real devices (not just DevTools emulation)
- Phase 4: XLSX image optimization to 200x100px must be tested with 50+ participant events to keep file size under 8MB email limits

## Session Continuity

Last session: 2026-02-13T21:29:11Z
Stopped at: Completed 03-04-PLAN.md
Resume file: None
