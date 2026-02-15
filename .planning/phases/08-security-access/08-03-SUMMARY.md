---
phase: 08-security-access
plan: 03
subsystem: security
tags: [csrf, security-headers, middleware, xss-protection]
dependency-graph:
  requires: []
  provides:
    - CSRF protection via double-submit cookie pattern
    - HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
    - CSRF token injection in all API calls
  affects:
    - All HTTP responses (security headers)
    - All API mutations (CSRF validation)
tech-stack:
  added:
    - Next.js middleware for security headers and CSRF
    - isomorphic-dompurify for XSS sanitization
  patterns:
    - Double-submit CSRF cookie pattern
    - Security header injection via Next.js middleware
    - Shared CSRF token utility for client-side usage
key-files:
  created:
    - backend/src/middleware.ts
    - backend/src/lib/security/csrf-client.ts
  modified:
    - backend/src/lib/api-fetch.ts
    - backend/src/lib/api.ts
    - backend/src/app/(payload)/api/events/[id]/regenerate-token/route.ts
decisions:
  - Used double-submit cookie pattern instead of @edge-csrf/nextjs (deprecated package)
  - CSRF token cookie set with httpOnly: false to allow JavaScript reads
  - Payload admin routes (/admin, /api/users) excluded from CSRF validation
  - HSTS header only enabled in production to avoid locking out local development
  - Permissive CSP policy allows 'unsafe-inline' and 'unsafe-eval' for Payload admin and Tailwind compatibility
metrics:
  duration: 5 minutes
  completed: 2026-02-15
---

# Phase 08 Plan 03: Security Headers & CSRF Protection Summary

HTTP security headers middleware and CSRF protection for all API endpoints using double-submit cookie pattern.

## What Was Built

**1. Next.js Security Middleware** (`backend/src/middleware.ts`)
- Implements double-submit CSRF cookie pattern (manual implementation due to deprecated @edge-csrf/nextjs)
- Sets CSRF token cookie on GET/HEAD requests (httpOnly: false for JavaScript access)
- Validates CSRF tokens on POST/PUT/DELETE/PATCH requests
- Excludes Payload admin routes from CSRF validation
- Adds comprehensive security headers to all responses:
  - **Content-Security-Policy**: Configured for Payload admin + Tailwind + future Turnstile CAPTCHA
  - **Strict-Transport-Security**: HSTS with 2-year max-age (production only)
  - **X-Frame-Options**: DENY (clickjacking protection)
  - **X-Content-Type-Options**: nosniff (MIME sniffing protection)
  - **Referrer-Policy**: strict-origin-when-cross-origin
  - **Permissions-Policy**: Blocks camera, microphone, geolocation, FLoC

**2. CSRF Token Injection** (`backend/src/lib/security/csrf-client.ts`)
- Shared `getCsrfToken()` utility reads `_csrf` cookie client-side
- Returns null on server-side (SSR safety)
- Centralized implementation prevents code duplication

**3. Organizer API CSRF Protection** (`backend/src/lib/api-fetch.ts`)
- `apiFetch()` automatically injects `X-CSRF-Token` header on mutations
- Applies to all organizer dashboard API calls
- Maintains existing `ApiError` class and error handling

**4. Public API CSRF Protection** (`backend/src/lib/api.ts`)
- Updated `createParticipant()`, `uploadSignatureImage()`, and `createSignature()` with CSRF tokens
- Protects public signing flow from CSRF attacks
- Preserves all function signatures and error handling

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Deprecated CSRF package**
- **Found during:** Task 1 - CSRF middleware implementation
- **Issue:** @edge-csrf/nextjs package is deprecated and shows warnings
- **Fix:** Implemented manual double-submit CSRF cookie pattern as specified in plan's fallback instructions. Generated random tokens using crypto.getRandomValues() in Edge runtime.
- **Files modified:** backend/src/middleware.ts
- **Commit:** fd4b581

**2. [Rule 3 - Blocking] Missing isomorphic-dompurify dependency**
- **Found during:** Task 1 verification (TypeScript compilation)
- **Issue:** Previous phase (08-02) created sanitize.ts importing isomorphic-dompurify but didn't install the package
- **Fix:** Installed isomorphic-dompurify via npm
- **Files modified:** backend/package.json, backend/package-lock.json
- **Commit:** fd4b581

**3. [Rule 3 - Blocking] TypeScript errors in validators.ts**
- **Found during:** Task 1 verification (TypeScript compilation)
- **Issue:** Previous phase code had type errors accessing `data.password` on `Partial<User>` type
- **Fix:** Auto-fixed by linter/Prettier with type assertion `data as typeof data & { password?: string }`
- **Files modified:** backend/src/lib/security/validators.ts (auto-fixed)
- **Commit:** Part of phase 08-02 cleanup

**4. [Rule 3 - Blocking] Wrong import path in regenerate-token route**
- **Found during:** Task 1 verification (TypeScript compilation)
- **Issue:** regenerate-token/route.ts used `@payload-config` alias which doesn't exist in tsconfig
- **Fix:** Changed to `@/payload.config` to match pattern used in other files
- **Files modified:** backend/src/app/(payload)/api/events/[id]/regenerate-token/route.ts
- **Commit:** fd4b581

## Testing Notes

**Manual verification required:**
1. Test CSRF protection works: Try POST request without X-CSRF-Token header (should get 403)
2. Test CSRF token cookie is set: Check browser DevTools > Application > Cookies for `_csrf`
3. Test security headers: Check Network tab for CSP, X-Frame-Options, HSTS in production
4. Test public signing flow still works: Submit signature through public page
5. Test organizer mutations: Create/update/delete events/participants

**TypeScript compilation:** ✓ Passes with no errors

## Key Decisions

1. **Double-submit cookie pattern over library**: Chose manual implementation after discovering @edge-csrf/nextjs is deprecated. This provides full control and avoids unmaintained dependencies.

2. **httpOnly: false for CSRF cookie**: Required to allow JavaScript to read the token for inclusion in request headers. This is safe because CSRF tokens are not authentication credentials.

3. **Payload admin exclusion**: Admin routes use Payload's own authentication and CSRF mechanisms. Our middleware focuses on protecting the frontend API endpoints.

4. **Production-only HSTS**: Prevents locking developers out of local HTTP development while ensuring production uses HTTPS.

5. **Permissive CSP**: Allows `unsafe-inline` and `unsafe-eval` required by Payload admin and Tailwind. Future hardening could use nonces for inline scripts.

## Files Changed

**Created:**
- `backend/src/middleware.ts` (93 lines) - Next.js middleware with security headers and CSRF
- `backend/src/lib/security/csrf-client.ts` (19 lines) - Shared CSRF token utility

**Modified:**
- `backend/src/lib/api-fetch.ts` - Added CSRF token injection to apiFetch()
- `backend/src/lib/api.ts` - Added CSRF tokens to public API functions
- `backend/src/app/(payload)/api/events/[id]/regenerate-token/route.ts` - Fixed import path
- `backend/package.json` - Added isomorphic-dompurify dependency

## Commits

1. `fd4b581` - feat(08-03): add security headers and CSRF protection middleware
2. `384bc89` - feat(08-03): inject CSRF tokens in all API calls

## Next Steps

Plan 08-04 (Token-based Event Access) and 08-05 (HTTPS & Security Config) should verify:
- CSRF tokens work with signing token authentication
- HSTS headers are actually applied in production deployment
- CSP policy doesn't block Cloudflare Turnstile when implemented

## Self-Check: PASSED

**Created files verification:**
```
✓ FOUND: backend/src/middleware.ts
✓ FOUND: backend/src/lib/security/csrf-client.ts
```

**Commits verification:**
```
✓ FOUND: fd4b581 (Task 1 - middleware)
✓ FOUND: 384bc89 (Task 2 - API CSRF injection)
```

**TypeScript compilation:**
```
✓ PASSED: No errors
```

**Security headers verification:**
```
✓ FOUND: 6 security headers configured
```

**CSRF protection verification:**
```
✓ FOUND: CSRF validation on POST/PUT/DELETE/PATCH
✓ FOUND: CSRF token injection in api-fetch.ts
✓ FOUND: CSRF token injection in api.ts (3 functions)
```
