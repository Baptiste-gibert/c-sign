---
phase: 08-security-access
plan: 06
subsystem: security
tags: [rate-limiting, captcha, fingerprinting, bot-protection, abuse-prevention]

# Dependency graph
requires:
  - phase: 08-03
    provides: CSRF protection and security headers
  - phase: 08-05
    provides: Token-based signing URLs
  - phase: 02-public-signing
    provides: Public signing page
provides:
  - Device fingerprint-based rate limiting (10 req/min soft limit, 20 req/min hard block)
  - Dynamic Cloudflare Turnstile CAPTCHA integration
  - Abuse protection for public signing endpoints
  - Security headers (X-Device-Fingerprint, X-Captcha-Token) in API calls
affects: [public-signing-flow, signature-submission, participant-creation, media-upload]

# Tech tracking
tech-stack:
  added:
    - "@fingerprintjs/fingerprintjs": Client-side device fingerprinting library
    - "Cloudflare Turnstile": Invisible/managed CAPTCHA for abuse detection
  patterns: [device-based rate limiting, dynamic CAPTCHA triggering, security header injection, graceful degradation]

key-files:
  created:
    - backend/src/lib/security/rateLimit.ts
    - backend/src/lib/security/captcha.ts
    - backend/src/lib/security/fingerprint.ts
    - backend/src/app/(payload)/api/signatures/check-rate/route.ts
  modified:
    - backend/src/views/SignPage.tsx
    - backend/src/lib/api.ts
    - backend/src/hooks/use-signature-submission.ts
    - backend/package.json

key-decisions:
  - "Device-based rate limiting (not IP-based) per user decision — prevents blocking legitimate users on shared WiFi"
  - "Conservative 10 req/min threshold tolerates fingerprint instability (browser restarts, private mode)"
  - "Two-tier limit: soft limit (10 req/min) triggers CAPTCHA, hard limit (20 req/min) blocks completely"
  - "Turnstile widget uses 'Managed' mode — invisible by default, interactive only when suspicious activity detected"
  - "CAPTCHA shown inline in signing flow (not blocking modal) — better UX for legitimate users"
  - "Security headers (X-Device-Fingerprint, X-Captcha-Token) separate from domain data — cleaner architecture"
  - "Graceful fallback when Turnstile not configured — rate limiting still active, CAPTCHA skipped in dev"
  - "Auto-retry submission after CAPTCHA completion — reduces user friction"
  - "Dark theme CAPTCHA widget matches public page design"

patterns-established:
  - "Pre-submission rate check prevents wasted API calls"
  - "Dynamic script loading for Turnstile reduces initial page weight"
  - "Global callback pattern for Turnstile success event"
  - "Security metadata passed via headers (not mixed with request body)"

# Metrics
duration: 3min
completed: 2026-02-15
---

# Phase 08 Plan 06: Rate Limiting & Bot Protection Summary

**Device fingerprint-based rate limiting with dynamic Cloudflare Turnstile CAPTCHA protects public signing endpoints from spam and automated abuse without blocking legitimate attendees**

## Performance

- **Duration:** 3 minutes
- **Started:** 2026-02-15T14:02:07Z
- **Completed:** 2026-02-15T14:05:18Z
- **Tasks:** 2
- **Files modified:** 8 (4 created, 4 modified)

## Accomplishments

- Server-side rate limiter with in-memory store tracking device fingerprints
- Cloudflare Turnstile server-side token verification utility
- Rate check API endpoint at `/api/signatures/check-rate`
- Client-side device fingerprinting using FingerprintJS
- Dynamic CAPTCHA widget in SignPage (shown only when triggered)
- Security headers (X-Device-Fingerprint, X-Captcha-Token) injected in all submission APIs
- Auto-retry submission after CAPTCHA completion
- Graceful degradation when Turnstile not configured

## Task Commits

Each task was committed atomically:

1. **Task 1: Server-side rate limiting and CAPTCHA verification utilities** - `9af9f2e` (feat)
   - Created rate limiter with device fingerprint-based tracking
   - In-memory store with automatic cleanup (60s interval)
   - Conservative 10 req/min threshold (tolerates fingerprint instability)
   - Two-tier limits: soft (10 req/min) triggers CAPTCHA, hard (20 req/min) blocks
   - Turnstile server-side verification utility with graceful fallback
   - Rate check API endpoint for pre-submission verification
   - Installed @fingerprintjs/fingerprintjs package

2. **Task 2: Client-side fingerprinting and dynamic CAPTCHA in signing flow** - `ba8163e` (feat)
   - Client-side fingerprint utility with cached FingerprintJS agent
   - Dynamic Turnstile script loading when CAPTCHA needed
   - Pre-submission rate check in SignPage.handleSubmit
   - CAPTCHA widget shown inline when rate limit triggered
   - Auto-retry submission after CAPTCHA completion
   - Security headers passed to all submission APIs (createParticipant, uploadSignatureImage, createSignature)
   - Dark theme CAPTCHA widget matching public page design

## Files Created/Modified

**Created:**
- `backend/src/lib/security/rateLimit.ts` - In-memory device fingerprint-based rate limiter
- `backend/src/lib/security/captcha.ts` - Turnstile server-side token verification
- `backend/src/lib/security/fingerprint.ts` - Client-side device fingerprinting utility
- `backend/src/app/(payload)/api/signatures/check-rate/route.ts` - Rate check API endpoint

**Modified:**
- `backend/src/views/SignPage.tsx` - Integrated fingerprinting, rate checking, and dynamic CAPTCHA
- `backend/src/lib/api.ts` - Added SecurityHeaders interface and security header injection
- `backend/src/hooks/use-signature-submission.ts` - Accept and pass deviceFingerprint and captchaToken
- `backend/package.json` - Added @fingerprintjs/fingerprintjs dependency

## Decisions Made

1. **Device-based rate limiting**: Per user decision, tracks device fingerprints (not IP addresses) to prevent blocking legitimate users sharing the same WiFi at events

2. **Conservative threshold**: 10 requests/min per device tolerates fingerprint instability (browser restarts, private mode switches) while still preventing abuse

3. **Two-tier limits**: Soft limit (10 req/min) triggers CAPTCHA challenge, hard limit (20 req/min) blocks completely — balances security with UX

4. **Turnstile managed mode**: Invisible by default, shows interactive challenge only when suspicious activity detected — frictionless for normal users

5. **Inline CAPTCHA**: Shown within signing flow (replaces form temporarily), not as blocking modal — better UX and clearer user guidance

6. **Security headers pattern**: X-Device-Fingerprint and X-Captcha-Token passed as headers (not in request body) — separates security metadata from domain data

7. **Graceful degradation**: When TURNSTILE_SECRET_KEY not configured (dev), rate limiting still active but CAPTCHA verification skipped

8. **Auto-retry**: After CAPTCHA completion, submission automatically retried with token — reduces user friction

9. **Dark theme**: CAPTCHA widget uses data-theme="dark" to match public page design

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - clean execution with TypeScript compiling successfully throughout.

## User Setup Required

**Cloudflare Turnstile configuration** (for production):

1. Create Cloudflare account at https://dash.cloudflare.com
2. Navigate to Turnstile section and create a new widget
3. Configure widget settings:
   - **Mode**: Managed (invisible when possible, interactive when needed)
   - **Hostnames**: Add production domain to allowed list
4. Copy credentials to environment variables:
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: Site key (public, client-side)
   - `TURNSTILE_SECRET_KEY`: Secret key (server-side verification)

**Dev environment**: Works without Turnstile configuration — rate limiting active, CAPTCHA verification gracefully skipped.

## Next Phase Readiness

Phase 08 (Security & Access) is now **complete**. All 6 plans executed:
- ✅ 08-01: Auth Sessions & Account Security
- ✅ 08-02: Input Validation & Sanitization
- ✅ 08-03: Security Headers & CSRF Protection
- ✅ 08-04: Token-based Event Access (Backend)
- ✅ 08-05: Frontend Token Migration
- ✅ 08-06: Rate Limiting & Bot Protection

**Security posture achieved:**
- Strong password policies with account lockout
- XSS prevention via input sanitization
- CSRF protection via double-submit cookie pattern
- Comprehensive HTTP security headers
- Unguessable signing URLs (token-based)
- Rate limiting prevents automated abuse
- Dynamic CAPTCHA blocks bot attacks
- Device-based tracking (not IP) prevents false positives

**Production deployment checklist:**
1. Configure Turnstile widget in Cloudflare Dashboard
2. Set TURNSTILE_SECRET_KEY in production environment
3. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY in production environment
4. Verify HSTS headers active in production (HTTPS)
5. Test CAPTCHA flow with real device submissions
6. Monitor rate limit triggers and adjust thresholds if needed

## Security Impact

**Attack vectors mitigated:**

1. **Spam submissions**: Device fingerprinting tracks submission rate per device, preventing automated bulk submissions through public signing endpoint

2. **Bot attacks**: Dynamic CAPTCHA challenge stops automated scripts while remaining invisible to legitimate users

3. **Shared WiFi scenarios**: Device-based (not IP-based) rate limiting prevents blocking entire venue WiFi when multiple legitimate attendees sign simultaneously

4. **Fingerprint evasion**: Two-tier limit system means even if attacker clears fingerprint, they only get 10 more attempts before CAPTCHA, 20 before hard block

**User experience:**
- Normal users (1-2 signatures): Never see CAPTCHA, frictionless flow
- Power users (testing, demos): May trigger soft limit, complete one CAPTCHA, continue
- Attackers (20+ requests/min): Hard blocked with French error message

**Operational benefits:**
- No external API costs (Turnstile free tier supports high volume)
- In-memory rate limiting (no Redis dependency in MVP)
- Graceful degradation in dev (works without Turnstile configuration)
- Self-cleaning store prevents memory leaks

---
*Phase: 08-security-access*
*Completed: 2026-02-15*

## Self-Check: PASSED

All claimed files and commits verified:

**Created files:**
- ✓ backend/src/lib/security/rateLimit.ts exists
- ✓ backend/src/lib/security/captcha.ts exists
- ✓ backend/src/lib/security/fingerprint.ts exists
- ✓ backend/src/app/(payload)/api/signatures/check-rate/route.ts exists

**Modified files:**
- ✓ backend/src/views/SignPage.tsx exists
- ✓ backend/src/lib/api.ts exists
- ✓ backend/src/hooks/use-signature-submission.ts exists
- ✓ backend/package.json exists

**Commits:**
- ✓ Commit 9af9f2e (Task 1) exists
- ✓ Commit ba8163e (Task 2) exists

**TypeScript compilation:**
- ✓ PASSED: No errors
