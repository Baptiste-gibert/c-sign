---
phase: 08-security-access
plan: 04
subsystem: security
tags: [tokens, nanoid, qr-codes, url-security, access-control]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Events collection with basic structure
  - phase: 03-organizer-dashboard
    provides: QR code generation endpoint
provides:
  - Cryptographically secure signing tokens for event URLs
  - Token generation utility using nanoid (~126 bits entropy)
  - Token regeneration API endpoint for compromised URLs
  - QR code generation using tokens instead of sequential IDs
affects: [08-05-frontend-token-migration, signing-flow, qr-code-ui]

# Tech tracking
tech-stack:
  added: [nanoid]
  patterns: [token-based URL security, backward-compatible API migration]

key-files:
  created:
    - backend/src/lib/security/tokens.ts
    - backend/src/app/(payload)/api/events/[id]/regenerate-token/route.ts
  modified:
    - backend/src/collections/Events.ts
    - backend/src/app/(payload)/api/qr-code/route.ts

key-decisions:
  - "nanoid chosen over UUID for shorter tokens (21 chars vs 36) with equivalent entropy"
  - "signingToken field is unique and indexed for fast lookups"
  - "Token generation happens on event creation via beforeChange hook"
  - "Dedicated API route for token regeneration (not checkbox field) for explicit action semantics"
  - "QR code endpoint supports both eventId (new) and dayId (legacy) for backward compatibility"
  - "New URL format: /sign/{token} with optional ?day={dayId} query param"

patterns-established:
  - "Token-based URL security pattern: unguessable tokens prevent enumeration attacks"
  - "Backward-compatible API migration: support both old and new parameter formats during transition"
  - "Dedicated endpoints for security-sensitive operations (regenerate-token)"

# Metrics
duration: 6min
completed: 2026-02-15
---

# Phase 08 Plan 04: Signing Tokens Summary

**Cryptographically secure signing tokens (nanoid, ~126 bits entropy) replace sequential IDs in event URLs, preventing brute-force enumeration attacks**

## Performance

- **Duration:** 6 minutes
- **Started:** 2026-02-15T13:44:42Z
- **Completed:** 2026-02-15T13:50:37Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Token generation utility using nanoid with 21-character URL-safe tokens (~126 bits entropy)
- Events collection auto-generates unique signingToken on creation
- API endpoint for token regeneration when URLs are compromised
- QR code generation updated to use tokens instead of sequential dayId
- Backward compatibility maintained during migration period

## Task Commits

Each task was committed atomically:

1. **Task 1: Token generation utility and Events signingToken field** - `84e56ad` (feat)
   - Installed nanoid package
   - Created token generation utility at lib/security/tokens.ts
   - Added signingToken field to Events collection (unique, indexed)
   - Added beforeChange hook to generate token on event creation
   - Created API route /api/events/[id]/regenerate-token

2. **Task 2: Update QR code route to use signingToken** - `a10c367` (feat)
   - Updated QR code endpoint to accept eventId parameter
   - Look up event by ID to retrieve signingToken
   - Generate URLs with token: /sign/{token}
   - Include dayId as query param for backward compatibility
   - Support legacy dayId-only flow during migration

## Files Created/Modified

- `backend/src/lib/security/tokens.ts` - Token generation utility using nanoid (21 chars, ~126 bits entropy)
- `backend/src/app/(payload)/api/events/[id]/regenerate-token/route.ts` - POST endpoint to regenerate compromised tokens
- `backend/src/collections/Events.ts` - Added signingToken field (unique, indexed) with auto-generation hook
- `backend/src/app/(payload)/api/qr-code/route.ts` - Updated to generate token-based URLs with backward compatibility

## Decisions Made

1. **nanoid over UUID**: Shorter tokens (21 vs 36 characters) with equivalent security (~126 bits entropy), better for QR codes and URLs
2. **Dedicated regeneration endpoint**: POST /api/events/[id]/regenerate-token is cleaner than a checkbox field - explicit action semantics
3. **URL format**: Primary identifier is token (/sign/{token}), with optional day query param (/sign/{token}?day={dayId}) for backward compatibility
4. **Backward compatibility**: QR endpoint supports both eventId (new) and dayId (legacy) parameters during migration to prevent breakage
5. **Auto-generation timing**: Token generated in beforeChange hook on create (not update) to ensure every new event has a token

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

1. **Import path for payload config**: Initial attempt used `@payload-config` but correct import is `@/payload.config` (identified via checking existing API routes)
2. **TypeScript path resolution**: Direct tsc compilation fails on path aliases; verified via Next.js dev server startup instead (proper test for Next.js project)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Token system fully operational for new events
- Existing events (created before this plan) have no signingToken - Plan 05 must handle migration
- QR code endpoint backward compatible - frontend can continue using dayId until migration complete
- Ready for Plan 05: Frontend signing page migration to token-based URLs

## Security Impact

**Before**: URLs like `/sign/5` allow brute-force enumeration - attackers can iterate through sequential IDs to access any event

**After**: URLs like `/sign/a7f3b2c9K4nL2pQr1sT3u` are cryptographically unguessable (~126 bits entropy = 2^126 possible values), making enumeration infeasible

**Attack mitigation**: Even if one token is discovered, it reveals nothing about other events' tokens (unlike sequential IDs where knowing one reveals all)

---
*Phase: 08-security-access*
*Completed: 2026-02-15*

## Self-Check: PASSED

All claimed files and commits verified:
- ✓ backend/src/lib/security/tokens.ts exists
- ✓ backend/src/app/(payload)/api/events/[id]/regenerate-token/route.ts exists
- ✓ backend/src/collections/Events.ts exists
- ✓ backend/src/app/(payload)/api/qr-code/route.ts exists
- ✓ Commit 84e56ad (Task 1) exists
- ✓ Commit a10c367 (Task 2) exists
