---
phase: 08-security-access
verified: 2026-02-15T14:29:08Z
status: passed
score: 12/12
re_verification:
  previous_status: gaps_found
  previous_score: 11/12
  gaps_closed:
    - "Dynamic CAPTCHA triggers only on suspicious submission volume — server-side verifyTurnstileToken() now wired to Signatures.ts and Participants.ts beforeChange hooks"
  gaps_remaining: []
  regressions: []
---

# Phase 08: Security & Access Verification Report

**Phase Goal:** Application is hardened for public deployment with defense-in-depth security: auth lockout, unguessable signing URLs, input sanitization, device-based rate limiting, CSRF protection, and production-safe configuration.

**Verified:** 2026-02-15T14:29:08Z
**Status:** passed
**Re-verification:** Yes — after gap closure (08-07)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Organizer sessions expire after 24 hours with strict cookie security | ✓ VERIFIED | Users.ts auth config: tokenExpiration: 86400, cookies.secure (prod), sameSite: 'Strict' |
| 2 | Accounts lock after 5 failed login attempts (admin-only unlock) | ✓ VERIFIED | Users.ts auth config: maxLoginAttempts: 5, lockTime: 0 (indefinite) |
| 3 | Passwords require 8+ chars, mixed case, at least one number | ✓ VERIFIED | validators.ts passwordSchema with Zod regex validation, validatePassword beforeChange hook in Users.ts |
| 4 | Organizers cannot access Payload admin panel (admin-only) | ✓ VERIFIED | Users.ts access.admin: user?.role === 'admin' (organizer excluded) |
| 5 | Public signing URLs use unguessable tokens (not sequential IDs) | ✓ VERIFIED | Events.ts signingToken field, tokens.ts generateSigningToken() uses nanoid (126 bits entropy) |
| 6 | Organizer can regenerate signing token to invalidate compromised links | ✓ VERIFIED | EventDetailPage regenerate button, useRegenerateToken hook, /api/events/[id]/regenerate-token route |
| 7 | Participant text inputs are sanitized server-side (HTML/script tags stripped) | ✓ VERIFIED | sanitize.ts sanitizeText with DOMPurify, sanitizeParticipantInput hook in Participants.ts |
| 8 | Image uploads validated by magic bytes, re-encoded through Sharp | ✓ VERIFIED | Media.ts validateAndSanitizeUpload hook: fileTypeFromBuffer validation, sharp re-encoding |
| 9 | CSRF tokens protect all state-changing API requests | ✓ VERIFIED | middleware.ts CSRF validation, api-fetch.ts + api.ts inject X-CSRF-Token header |
| 10 | Security headers (CSP, HSTS, X-Frame-Options) on all responses | ✓ VERIFIED | middleware.ts sets CSP, HSTS (prod), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| 11 | Device fingerprint-based rate limiting detects abuse | ✓ VERIFIED | rateLimit.ts checkRateLimit(), check-rate route, SignPage pre-submission check |
| 12 | Dynamic CAPTCHA triggers only on suspicious submission volume | ✓ VERIFIED | Client-side: SignPage shows Turnstile widget when rate limit triggers. Server-side: verifyCaptchaOnCreate hook calls verifyTurnstileToken() in both Signatures.ts (line 18) and Participants.ts (line 22). checkRateLimit() enforced server-side as defense-in-depth (Signatures.ts line 28, Participants.ts line 32). Authenticated users bypass CAPTCHA in Participants.ts (line 16). |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/src/collections/Users.ts` | Auth hardening config | ✓ VERIFIED | maxLoginAttempts: 5, tokenExpiration: 86400, admin-only access, validatePassword hook |
| `backend/src/lib/security/validators.ts` | Password policy validation | ✓ VERIFIED | passwordSchema with Zod regex validation, validatePassword beforeChange hook |
| `backend/src/payload.config.ts` | Production security flags | ✓ VERIFIED | graphQL.disable: true in production |
| `backend/src/lib/security/sanitize.ts` | HTML sanitization utility | ✓ VERIFIED | sanitizeText + sanitizeParticipantInput with DOMPurify |
| `backend/src/collections/Participants.ts` | Sanitization + CAPTCHA hooks | ✓ VERIFIED | verifyCaptchaOnCreate (first hook) + sanitizeParticipantInput in beforeChange |
| `backend/src/collections/Media.ts` | Upload validation | ✓ VERIFIED | validateAndSanitizeUpload hook with magic byte check + sharp re-encoding |
| `backend/src/middleware.ts` | Security headers + CSRF | ✓ VERIFIED | CSP/HSTS/X-Frame-Options headers, double-submit CSRF pattern |
| `backend/src/lib/api-fetch.ts` | CSRF injection (organizer) | ✓ VERIFIED | getCsrfToken() + X-CSRF-Token header on mutations |
| `backend/src/lib/api.ts` | CSRF injection (public) | ✓ VERIFIED | getCsrfToken() in createParticipant/uploadSignatureImage/createSignature |
| `backend/src/lib/security/tokens.ts` | Token generation | ✓ VERIFIED | generateSigningToken() with nanoid |
| `backend/src/collections/Events.ts` | signingToken field | ✓ VERIFIED | signingToken field + auto-generation in beforeChange hook |
| `backend/src/app/(payload)/api/qr-code/route.ts` | QR using token | ✓ VERIFIED | uses event.signingToken in QR URL |
| `backend/src/app/(frontend)/sign/[token]/page.tsx` | Token-based route | ✓ VERIFIED | Renders SignPage component |
| `backend/src/views/SignPage.tsx` | Token-based loading + CAPTCHA | ✓ VERIFIED | useParams token, fetchEventByToken, Turnstile CAPTCHA widget |
| `backend/src/views/EventDetailPage.tsx` | Regenerate token UI | ✓ VERIFIED | handleRegenerateToken button |
| `backend/src/components/AttendanceDashboard.tsx` | Token in share URLs | ✓ VERIFIED | /sign/{signingToken} URLs |
| `backend/src/hooks/use-events.ts` | useRegenerateToken hook | ✓ VERIFIED | mutation calling /api/events/[id]/regenerate-token |
| `backend/src/lib/security/rateLimit.ts` | Rate limiter | ✓ VERIFIED | checkRateLimit with device fingerprint tracking |
| `backend/src/lib/security/captcha.ts` | Turnstile verification | ✓ VERIFIED | verifyTurnstileToken(), imported and called in Signatures.ts and Participants.ts beforeChange hooks |
| `backend/src/lib/security/fingerprint.ts` | Device fingerprinting | ✓ VERIFIED | getFingerprint with FingerprintJS |
| `backend/src/app/(payload)/api/signatures/check-rate/route.ts` | Rate check endpoint | ✓ VERIFIED | checkRateLimit integration |
| `backend/src/lib/security/csrf-client.ts` | CSRF token reader | ✓ VERIFIED | getCsrfToken() parses _csrf cookie |

**Artifacts:** 22/22 fully verified

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| validators.ts | Users.ts | beforeChange hook import | ✓ WIRED | validatePassword imported and used in hooks array |
| Users.ts | Payload auth | auth config object | ✓ WIRED | maxLoginAttempts: 5, lockTime: 0 in auth object |
| sanitize.ts | Participants.ts | beforeChange hook import | ✓ WIRED | sanitizeParticipantInput imported and used |
| Media.ts | sharp | image re-encoding | ✓ WIRED | sharp() called in validateAndSanitizeUpload hook |
| middleware.ts | All HTTP responses | Next.js middleware | ✓ WIRED | Security headers set on NextResponse, CSRF validation active |
| api-fetch.ts | middleware.ts | CSRF token validation | ✓ WIRED | X-CSRF-Token header validated by middleware |
| api.ts | middleware.ts | CSRF token validation | ✓ WIRED | X-CSRF-Token header validated by middleware |
| tokens.ts | Events.ts | beforeChange hook | ✓ WIRED | generateSigningToken() called on create operation |
| Events.ts | qr-code route | QR uses signingToken | ✓ WIRED | qr-code/route.ts reads event.signingToken |
| sign/[token]/page.tsx | SignPage.tsx | component render | ✓ WIRED | Renders SignPage component |
| SignPage.tsx | api.ts | fetchEventByToken | ✓ WIRED | Calls fetchEventByToken(token) in useEffect |
| EventDetailPage.tsx | use-events.ts | regenerate mutation | ✓ WIRED | useRegenerateToken hook called on button click |
| use-events.ts | regenerate-token route | API mutation | ✓ WIRED | POST /api/events/[id]/regenerate-token |
| fingerprint.ts | SignPage.tsx | device fingerprinting | ✓ WIRED | getFingerprint() called in handleSubmit |
| rateLimit.ts | check-rate route | rate limiting | ✓ WIRED | checkRateLimit() called in /api/signatures/check-rate |
| SignPage.tsx | check-rate route | pre-submission check | ✓ WIRED | Fetches /api/signatures/check-rate before submission |
| captcha.ts | Signatures.ts | server-side CAPTCHA verification | ✓ WIRED | verifyTurnstileToken imported (line 3) and called (line 18) in verifyCaptchaOnCreate hook, registered as first beforeChange hook (line 83) |
| captcha.ts | Participants.ts | server-side CAPTCHA verification | ✓ WIRED | verifyTurnstileToken imported (line 3) and called (line 22) in verifyCaptchaOnCreate hook, registered as first beforeChange hook (line 57) |

**Key Links:** 18/18 wired (previously 16/17, gap closed + bonus Participants.ts link added)

### Anti-Patterns Found

No blocker or warning anti-patterns found in modified files (Signatures.ts, Participants.ts). All previously noted anti-patterns from the initial verification have been resolved.

### Human Verification Required

#### 1. Session Expiry & Cookie Security

**Test:** Log in as organizer, wait 24 hours (or manually advance system time), try to access protected route.
**Expected:** Session expires, user redirected to login.
**Why human:** Requires time-based testing or system clock manipulation.

#### 2. Account Lockout After 5 Failed Attempts

**Test:** Attempt login with wrong password 5 times, verify account locked, try correct password.
**Expected:** Account locked after 5 failures, admin-only unlock.
**Why human:** Requires deliberate failed login attempts and admin panel verification.

#### 3. Password Policy Enforcement

**Test:** Try creating user with "short", "lowercase123", "UPPERCASE123", "NoDigits", then "Secure123".
**Expected:** First 4 rejected, last accepted.
**Why human:** Requires form submission and error message inspection.

#### 4. Organizer Cannot Access /admin Panel

**Test:** Log in as organizer (not admin), navigate to /admin.
**Expected:** Organizer blocked from Payload admin panel.
**Why human:** Requires authentication and access control testing.

#### 5. Signing URL Token Unguessability

**Test:** Create event, view signing URL, try modifying token characters.
**Expected:** Only exact token works, modified tokens fail.
**Why human:** Requires manual token manipulation and URL testing.

#### 6. Token Regeneration Invalidates Old Links

**Test:** Create event, copy signing URL, click "Regenerate Token", try old URL.
**Expected:** Old URL fails, new URL works.
**Why human:** Requires user flow testing across token regeneration.

#### 7. HTML/Script Tag Sanitization

**Test:** Submit signature with `<script>alert('XSS')</script>` in name field, view in dashboard.
**Expected:** Script tags stripped, no alert.
**Why human:** Requires XSS injection attempt and visual verification.

#### 8. Image Upload Magic Byte Validation

**Test:** Create file "fake.png" with mismatched magic bytes, try uploading.
**Expected:** Upload rejected with error.
**Why human:** Requires binary file manipulation.

#### 9. CSRF Protection

**Test:** Submit signature, replay POST request without X-CSRF-Token header.
**Expected:** Request rejected with 403.
**Why human:** Requires HTTP request interception/replay.

#### 10. Security Headers Presence

**Test:** Open any page, check Response Headers in DevTools.
**Expected:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy present.
**Why human:** Requires visual header inspection.

#### 11. Rate Limiting Triggers CAPTCHA

**Test:** Submit 10 signatures rapidly, verify CAPTCHA appears on 11th.
**Expected:** CAPTCHA shown after threshold, submission allowed after completion.
**Why human:** Requires rapid repeated submissions and visual verification.

#### 12. Server-Side CAPTCHA Enforcement (NEW)

**Test:** With rate limit triggered, send direct POST to /api/signatures without X-Captcha-Token header.
**Expected:** Request rejected with "Verification CAPTCHA requise" error.
**Why human:** Requires API call manipulation with specific rate limit state.

---

_Verified: 2026-02-15T14:29:08Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification after gap closure 08-07_
