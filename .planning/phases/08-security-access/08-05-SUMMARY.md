---
phase: 08-security-access
plan: 05
subsystem: security
tags: [frontend-migration, token-urls, url-security, qr-codes, regeneration]

# Dependency graph
requires:
  - phase: 08-04
    provides: Backend signing token infrastructure
  - phase: 02-public-signing
    provides: Public signing page with dayId URLs
  - phase: 03-organizer-dashboard
    provides: Organizer UI with QR codes
provides:
  - Token-based public signing URLs (/sign/{token}?day={dayId})
  - Day selection UI for multi-day events
  - Token regeneration capability for compromised links
  - All organizer UI updated to token-based URLs
affects: [public-signing-flow, qr-code-generation, organizer-event-management]

# Tech tracking
tech-stack:
  added: []
  patterns: [token-based routing, query param for backward compatibility, confirmation dialogs for destructive actions]

key-files:
  created:
    - backend/src/app/(frontend)/sign/[token]/page.tsx
  modified:
    - backend/src/views/SignPage.tsx
    - backend/src/lib/api.ts
    - backend/src/views/EventDetailPage.tsx
    - backend/src/components/AttendanceDashboard.tsx
    - backend/src/hooks/use-events.ts
    - backend/src/i18n/locales/fr/public.json
    - backend/src/i18n/locales/en/public.json
    - backend/src/i18n/locales/fr/organizer.json
    - backend/src/i18n/locales/en/organizer.json
  deleted:
    - backend/src/app/(frontend)/sign/[dayId]/page.tsx

key-decisions:
  - "URL format /sign/{token}?day={dayId} keeps token primary, dayId as query param for backward compatibility"
  - "Old /sign/[dayId] route deleted completely (no graceful redirect) per security requirements"
  - "Day selection UI added for multi-day events without ?day= query param"
  - "Token regeneration requires confirmation dialog and only available when event is open/reopened"
  - "Regeneration invalidates entire TanStack Query cache to refresh all UI components"
  - "signingToken prop passed explicitly to AttendanceDashboard (not fetched independently)"

patterns-established:
  - "Multi-step data loading: token → event → day selection → sessions → form"
  - "Optional query params for pre-selection: ?day={id}&session={id}"
  - "Auto-selection when count === 1 (single day, single session)"
  - "Confirmation dialogs for destructive actions using window.confirm"

# Metrics
duration: 5min
completed: 2026-02-15
---

# Phase 08 Plan 05: Frontend Token Migration Summary

**Public signing URLs migrated from sequential IDs to cryptographically secure tokens, eliminating enumeration attack vector**

## Performance

- **Duration:** 5 minutes
- **Started:** 2026-02-15T13:53:48Z
- **Completed:** 2026-02-15T13:58:51Z
- **Tasks:** 2
- **Files modified:** 11 (9 modified, 1 created, 1 deleted)

## Accomplishments
- Token-based public signing route created at `/sign/[token]`
- SignPage rewritten to load event by token with day/session selection
- Old sequential ID route `/sign/[dayId]` completely removed
- All organizer UI QR codes updated to token-based URLs
- Token regeneration feature with confirmation dialog
- Day selection UI for multi-day events
- Translations added for selectDay, invalidDay, regeneration UI

## Task Commits

Each task was committed atomically:

1. **Task 1: New token-based signing route and SignPage migration** - `b8279d4` (feat)
   - Added fetchEventByToken API function
   - Created /sign/[token] route with optional ?day= query param
   - Deleted old /sign/[dayId] route
   - Rewrote SignPage to load event by token, not dayId
   - Added day selection UI for multi-day events
   - Added translations for selectDay and invalidDay

2. **Task 2: Update organizer UI URLs and add token regeneration** - `e768342` (feat)
   - Added signingToken field to PayloadEvent interface
   - Created useRegenerateToken mutation hook
   - Updated all QR code URLs to /sign/{token}?day={dayId}
   - Added regenerate link button with confirmation dialog
   - Passed signingToken to AttendanceDashboard
   - Added translations for regeneration UI

## Files Created/Modified

**Created:**
- `backend/src/app/(frontend)/sign/[token]/page.tsx` - New token-based signing route

**Modified:**
- `backend/src/views/SignPage.tsx` - Rewritten to load event by token, handle day selection
- `backend/src/lib/api.ts` - Added fetchEventByToken function
- `backend/src/views/EventDetailPage.tsx` - Updated QR URLs, added regeneration button
- `backend/src/components/AttendanceDashboard.tsx` - Updated QR URLs to use signingToken prop
- `backend/src/hooks/use-events.ts` - Added signingToken field, useRegenerateToken hook
- `backend/src/i18n/locales/fr/public.json` - Added selectDay, invalidDay
- `backend/src/i18n/locales/en/public.json` - Added selectDay, invalidDay
- `backend/src/i18n/locales/fr/organizer.json` - Added regenerateLink, regenerateLinkConfirm, linkRegenerated
- `backend/src/i18n/locales/en/organizer.json` - Added regenerateLink, regenerateLinkConfirm, linkRegenerated

**Deleted:**
- `backend/src/app/(frontend)/sign/[dayId]/page.tsx` - Old sequential ID route

## Decisions Made

1. **URL format**: Primary identifier is token (/sign/{token}), with optional day/session query params for backward compatibility and pre-selection
2. **Old route handling**: Clean delete (no redirect or "link expired" message) - old URLs should not work per security model
3. **Day selection**: Show radio list when event has multiple days and no ?day= param, auto-select when single day
4. **Regeneration UI**: Confirmation dialog (window.confirm) before regenerating, button only visible when event is open/reopened
5. **Cache invalidation**: Regeneration invalidates all events queries to refresh URLs across all UI components
6. **Data flow**: Token → event (with populated attendanceDays) → day selection → sessions → form (multi-step loading)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - clean execution with TypeScript compiling successfully throughout.

## User Setup Required

None - frontend-only changes, no external service configuration.

## Next Phase Readiness

- Public signing pages now use unguessable token URLs
- Old sequential ID URLs no longer work (security vulnerability eliminated)
- Organizers can regenerate tokens to invalidate compromised links
- Multi-day event signing flow fully functional with day selection
- Ready for Plan 06: Rate Limiting & Bot Protection

## Security Impact

**Before**: URLs like `/sign/5` allow brute-force enumeration - attackers can iterate through sequential IDs to access any event

**After**: URLs like `/sign/a7f3b2c9K4nL2pQr1sT3u?day=123` are:
- Cryptographically unguessable (~126 bits entropy)
- Event-scoped (token tied to event lifecycle)
- Regeneratable (compromised links can be invalidated)

**Attack mitigation**: Even if one token is discovered, it reveals nothing about other events' tokens (unlike sequential IDs where knowing one reveals the pattern)

**URL enumeration attack**: Completely eliminated - no predictable pattern in signing URLs

---
*Phase: 08-security-access*
*Completed: 2026-02-15*

## Self-Check: PASSED

All claimed files and commits verified:
- ✓ backend/src/app/(frontend)/sign/[token]/page.tsx exists
- ✓ backend/src/views/SignPage.tsx exists
- ✓ backend/src/lib/api.ts exists
- ✓ backend/src/views/EventDetailPage.tsx exists
- ✓ backend/src/components/AttendanceDashboard.tsx exists
- ✓ backend/src/hooks/use-events.ts exists
- ✓ backend/src/i18n/locales/fr/public.json exists
- ✓ backend/src/i18n/locales/en/public.json exists
- ✓ backend/src/i18n/locales/fr/organizer.json exists
- ✓ backend/src/i18n/locales/en/organizer.json exists
- ✓ backend/src/app/(frontend)/sign/[dayId]/page.tsx deleted
- ✓ Commit b8279d4 (Task 1) exists
- ✓ Commit e768342 (Task 2) exists
