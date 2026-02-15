# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** Organizers can collect legally-valid digital signatures from external participants (veterinarians, pharmacists) on any device, without requiring them to log in or install anything.
**Current focus:** All 8 phases complete. Milestone 1 finished.

## Current Position

Phase: 9 of 9 (Code Quality)
Plan: 3 of 3 in current phase
Status: In Progress — phase 9 started
Last activity: 2026-02-15 — Completed 09-03 (Dependency Cleanup & Pre-commit Hooks)

Progress: [▓▓▓▓▓▓▓▓▓▓▓] 99%

## Performance Metrics

**Velocity:**
- Total plans completed: 30
- Average duration: 5 min
- Total execution time: 12.7 hours

**By Phase:**

| Phase | Plans | Total  | Avg/Plan |
|-------|-------|--------|----------|
| 01    | 3     | 23m    | 8m       |
| 02    | 3     | 9m     | 3m       |
| 03    | 5     | 27m    | 5m       |
| 04    | 2     | 10h 4m | 5h 2m    |
| 05    | 3     | 29m    | 10m      |
| 06    | 3     | 6m     | 2m       |
| 07    | 3     | 6m     | 2m       |
| 08    | 7     | 29m    | 4m       |
| 09    | 2     | 7m     | 3m       |

**Recent Trend:**
- Last 5 plans: 08-05 (5m), 08-06 (3m), 08-07 (2m), 09-01 (4m), 09-03 (3m)
- Trend: Phase 9 progressing; dependency cleanup and pre-commit hooks complete

*Updated after each plan completion*
| Phase 07 P03 | 71 | 2 tasks | 7 files |
| Phase 07 P02 | 180 | 2 tasks | 5 files |
| Phase 08 P01 | 209 | 2 tasks | 2 files |
| Phase 08 P02 | 5 | 2 tasks | 4 files |
| Phase 08 P03 | 5 | 2 tasks | 6 files |
| Phase 08 P04 | 6 | 2 tasks | 4 files |
| Phase 08 P05 | 5 | 2 tasks | 11 files |
| Phase 08 P05 | 5 | 2 tasks | 11 files |
| Phase 08 P06 | 3 | 2 tasks | 8 files |
| Phase 08 P07 | 2 | 2 tasks | 2 files |
| Phase 09 P01 | 4 | 2 tasks | 73 files |
| Phase 09 P03 | 3 | 2 tasks | 5 files |

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
- 03-05: afterEventChange hook must auto-create "Session principale" per new AttendanceDay — sign page requires at least one session
- 03-05: Signatures beforeChange hook validates event status (only open events accept signatures) — prevents signing on draft/finalized events
- 03-05: Frontend SignPage checks event.status and hides form for non-open events with French status message
- 04-01: Fire-and-forget email delivery prevents blocking HTTP responses on status updates — afterFinalize calls generateAndEmailExport without await
- 04-01: ExcelJS image anchors use 0-indexed coordinates — use row.number - 1 for tl anchor, row.number for br anchor
- 04-01: Missing/corrupted signature images gracefully skipped without failing entire export — wrapped in try/catch with logging
- 04-01: SMTP auth is conditional in Payload config — undefined when SMTP_USER not set, allows dev without SMTP credentials
- 04-01: 8MB file size warning for XLSX exports — logs warning but doesn't block export
- 04-02: Blob URL download pattern keeps user on page during XLSX download — no navigation away from event detail
- 04-02: Payload relationship arrays not auto-populated when children created via hooks — must use direct queries with where clauses
- 04-02: overrideAccess required for all Payload queries in server contexts — access control applies even when route validates auth
- 05-01: French as fallback language (fallbackLng: 'fr') per project requirements — primary language for Ceva Sante Animale France
- 05-01: Three-namespace i18n organization (common/public/organizer) for clear separation and future code-splitting potential
- 05-01: localStorage-first language detection for persistence across sessions — better UX than navigator-only detection
- 05-01: LanguageSwitcher shows opposite language (EN when French, FR when English) following standard bilingual website UX pattern
- 05-02: Zod validation messages use i18n.t() for reactive language switching at validation time — messages evaluated when validation runs, not when schema defined
- 05-02: Date formatting switches locale (enUS/fr) based on i18n.language across all components using date-fns
- 05-02: Multi-namespace translation usage (common/public/organizer) enables shared strings while maintaining separation of concerns
- [Phase 05-03]: Factory pattern for Zod schemas: schemas converted to functions that evaluate i18n.t() at call time, enabling reactive validation messages
- [Phase 05-03]: Responsive signature canvas uses h-40 sm:h-48 md:h-56 for adaptive height across devices
- 06-01: Reopened status functionally equivalent to open for signatures (no explicit validation needed)
- 06-01: Re-finalization detected via previousDoc.status === 'reopened' (no timestamp field needed)
- 06-01: CNOV metadata conditionally added to XLSX only when populated (graceful omission)
- 06-02: isLocked variable distinguishes truly locked (finalized only) from reopened state — enables participant management when reopened
- 06-02: Reopened events use amber badge color to visually distinguish from finalized (blue) and open (green)
- 06-02: Optimistic updates for walk-in participant addition provide instant visual feedback before server response
- 06-03: CNOV field is optional string in createEventSchema — no validation rules needed
- 06-03: CNOV inline edit uses state sync via useEffect — ensures UI reflects server state after updates
- 06-03: CNOV edit controls hidden when isLocked — maintains finalized event immutability for non-reopened events
- 08-01: Auth sessions expire after 24 hours (tokenExpiration: 86400) requiring re-login
- 08-01: Account lockout after 5 failed login attempts with indefinite lock (lockTime: 0, admin-only unlock)
- 08-01: Secure cookies conditional on NODE_ENV (HTTPS in production, HTTP allowed in dev)
- 08-01: Admin panel access restricted to admin role only (organizers use frontend exclusively)
- 08-01: Password policy enforced via beforeChange hook (8+ chars, mixed case, digit requirement)
- 08-01: Password field accessed via type casting in validators (not exposed in generated Payload types)
- 08-02: DOMPurify with ALLOWED_TAGS: [] strips all HTML while preserving text content
- 08-04: nanoid chosen over UUID for signing tokens (21 chars vs 36, ~126 bits entropy, better for QR codes)
- 08-04: signingToken field is unique and indexed on Events for fast lookups
- 08-04: Token generation happens in beforeChange hook on event creation (not update)
- 08-04: Dedicated API route for token regeneration (/api/events/[id]/regenerate-token) provides explicit action semantics
- 08-04: QR code endpoint supports both eventId (new) and dayId (legacy) for backward compatibility during migration
- 08-04: New URL format is /sign/{token} with optional ?day={dayId} query param for existing signing page compatibility
- 08-05: URL format /sign/{token}?day={dayId} keeps token primary, dayId as query param for backward compatibility
- 08-02: Magic byte validation using file-type package prevents MIME type spoofing
- 08-02: Sharp re-encoding to PNG with compressionLevel 9 destroys polyglot payloads
- 08-02: Removed webp from allowed MIME types - PNG/JPEG only per security requirements
- [Phase 08]: Double-submit CSRF cookie pattern used instead of @edge-csrf/nextjs library (deprecated package)
- [Phase 08-05]: URL format /sign/{token}?day={dayId} keeps token primary, dayId as query param for backward compatibility
- [Phase 08-06]: Device-based rate limiting (not IP-based) prevents blocking legitimate users on shared WiFi
- [Phase 08-06]: Two-tier rate limit: 10 req/min triggers CAPTCHA, 20 req/min hard blocks
- [Phase 08-06]: Turnstile CAPTCHA in managed mode (invisible by default, interactive when suspicious)
- [Phase 08-07]: CAPTCHA token optional in hooks: if present must be valid, if absent rate limit re-check determines rejection
- [Phase 08-07]: Authenticated users bypass CAPTCHA in Participants (organizers creating via dashboard not challenged)
- [Phase 09-01]: @eslint/js version 9 (not 10) for ESLint 9.x compatibility
- [Phase 09-01]: ESLint 9 flat config pattern with tseslint.config() helper
- [Phase 09-01]: Prettier placed last in config to disable conflicting formatting rules
- [Phase 09-01]: Tailwind plugin requires tailwindStylesheet path to globals.css in (frontend) route group
- [Phase 09-01]: Format entire codebase upfront (Plan 01) before fixing lint errors (Plan 02)
- [Phase 09-03]: Removed 7 unused dependencies (@edge-csrf/nextjs, @radix-ui/react-*, react-router-dom, nodemailer)
- [Phase 09-03]: CSS-imported packages (@fontsource/inter, tailwindcss) kept despite depcheck flags
- [Phase 09-03]: Husky hooks at repo root with pre-commit changing to backend/ subdirectory
- [Phase 09-03]: file-type available via Payload CMS peer dependencies (not added as direct dependency)

### Roadmap Evolution

- Phase 7 added: UI Design & Style Guide Application
- Phase 8 added: Security & Access
- Phase 9 added: Code Quality

### Pending Todos

- Data model review: Sessions have no direct link to Event (must traverse Session → AttendanceDay → Event). Consider simplifying the Event > Session > AttendanceDay hierarchy before Phase 3 organizer dashboard. May also want to add Session.event convenience relationship.

### Blockers/Concerns

- Phase 2: iOS Safari signature canvas compatibility must be validated on real devices (not just DevTools emulation)
- Phase 4: XLSX image optimization to 200x100px must be tested with 50+ participant events to keep file size under 8MB email limits

## Session Continuity

Last session: 2026-02-15T16:21:31Z
Stopped at: Completed 09-03-PLAN.md (Dependency Cleanup & Pre-commit Hooks)
Resume file: None
