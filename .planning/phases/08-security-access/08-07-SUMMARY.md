---
phase: 08-security-access
plan: 07
subsystem: api
tags: [captcha, turnstile, rate-limiting, security, payload-hooks]

# Dependency graph
requires:
  - phase: 08-06
    provides: "Rate limiting infrastructure (checkRateLimit) and CAPTCHA widget (verifyTurnstileToken)"
provides:
  - "Server-side CAPTCHA enforcement in Signatures and Participants collection hooks"
  - "Defense-in-depth: rate limit re-check in beforeChange hooks"
  - "Closes orphaned captcha.ts export gap from 08-VERIFICATION.md"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CollectionBeforeChangeHook pattern for server-side CAPTCHA verification"
    - "Defense-in-depth: re-check rate limit in collection hooks, not just API routes"

key-files:
  created: []
  modified:
    - "backend/src/collections/Signatures.ts"
    - "backend/src/collections/Participants.ts"

key-decisions:
  - "CAPTCHA token optional: if present it must be valid, if absent the rate limit re-check determines whether to reject"
  - "Authenticated users (req.user) bypass CAPTCHA in Participants — organizers creating participants via dashboard should not be challenged"
  - "CAPTCHA hook runs first in beforeChange array to reject invalid requests before expensive DB lookups"

patterns-established:
  - "verifyCaptchaOnCreate hook pattern: check token -> re-check rate limit -> allow/reject"

# Metrics
duration: 2min
completed: 2026-02-15
---

# Phase 8 Plan 7: Wire Server-Side CAPTCHA Verification Summary

**Server-side Turnstile CAPTCHA verification wired into Signatures.ts and Participants.ts beforeChange hooks, closing the critical gap where verifyTurnstileToken() existed but was never called**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-15T14:24:06Z
- **Completed:** 2026-02-15T14:25:37Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Wired verifyTurnstileToken() from captcha.ts into both Signatures and Participants collection hooks
- Added defense-in-depth: server-side rate limit re-check via X-Device-Fingerprint header rejects requests that should have been CAPTCHA-challenged
- Authenticated users bypass CAPTCHA in Participants (organizers/admins creating participants via dashboard)
- CAPTCHA verification runs as first hook in both collections, catching invalid requests before expensive DB operations

## Task Commits

Each task was committed atomically:

1. **Task 1: Add server-side CAPTCHA verification to Signatures beforeChange hook** - `343297f` (feat)
2. **Task 2: Add server-side CAPTCHA verification to Participants beforeChange hook** - `8b1e3bb` (feat)

## Files Created/Modified
- `backend/src/collections/Signatures.ts` - Added verifyCaptchaOnCreate hook with token verification and rate limit re-check
- `backend/src/collections/Participants.ts` - Added verifyCaptchaOnCreate hook with authenticated user bypass, token verification, and rate limit re-check

## Decisions Made
- **CAPTCHA token is optional in the hook**: If a token IS present, it must be valid (reject on failure). If NO token is present, the hook checks the device fingerprint against the rate limiter. This design supports the flow where rate limiting triggers CAPTCHA progressively.
- **Authenticated user bypass**: Participants.ts skips CAPTCHA for req.user because organizers adding walk-in participants from the dashboard should never be challenged.
- **Hook ordering**: CAPTCHA verification placed as FIRST beforeChange hook in both collections to fail fast before expensive event status lookups (Signatures) or sanitization (Participants).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. The TURNSTILE_SECRET_KEY environment variable was already configured in plan 08-06.

## Next Phase Readiness
- Phase 8 security hardening is now complete with all gaps closed
- CAPTCHA verification is end-to-end: client-side widget (08-06) + server-side enforcement (08-07)
- The verifyTurnstileToken export in captcha.ts is no longer orphaned

## Self-Check: PASSED

- FOUND: backend/src/collections/Signatures.ts
- FOUND: backend/src/collections/Participants.ts
- FOUND: 08-07-SUMMARY.md
- FOUND: commit 343297f (Task 1)
- FOUND: commit 8b1e3bb (Task 2)

---
*Phase: 08-security-access*
*Completed: 2026-02-15*
