# Phase 8: Security & Access — Human Verification

**App URL:** http://localhost:3000 (unified Next.js — Payload CMS + frontend)
**Admin URL:** http://localhost:3000/admin

## Prerequisites

- App running (`cd /workspace/backend && npm run dev`)
- Seed data loaded (`curl http://localhost:3000/api/seed`)
- At least one event in "open" status
- A browser with DevTools (Chrome/Firefox recommended)

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@ceva.com | admin123 | Admin |
| isabelle.leroy@ceva.com | organizer123 | Organizer |
| marc.dupont@ceva.com | organizer123 | Organizer |

> **Note:** These seed accounts were created before the password policy was added. New accounts must follow the policy (8+ chars, mixed case, digit).

---

## Test 1: Password Policy Enforcement

- [ ] Go to http://localhost:3000/admin
- [ ] Log in as admin (admin@ceva.com / admin123)
- [ ] Navigate to Users collection → Create New User
- [ ] Try creating a user with password `short` → should be rejected (too short)
- [ ] Try password `lowercase123` → should be rejected (no uppercase)
- [ ] Try password `UPPERCASE123` → should be rejected (no lowercase)
- [ ] Try password `NoDigits` → should be rejected (no number)
- [ ] Try password `Secure123` → should be accepted
- [ ] Verify error messages are descriptive (French: "Le mot de passe doit contenir au moins 8 caracteres..." or similar)

## Test 2: Account Lockout After 5 Failed Attempts

- [ ] Log out of all sessions
- [ ] Go to http://localhost:3000/login
- [ ] Attempt to log in with `isabelle.leroy@ceva.com` and a WRONG password — repeat 5 times
- [ ] On the 6th attempt with the CORRECT password (`organizer123`):
  - [ ] Login should still fail — account is locked
  - [ ] Error message should indicate lockout
- [ ] Go to http://localhost:3000/admin, log in as admin
- [ ] Navigate to Users → find Isabelle → verify account shows locked status
- [ ] Unlock the account (remove lock or reset via admin panel)
- [ ] Go back to http://localhost:3000/login
- [ ] Log in as Isabelle with correct password → should now succeed

## Test 3: Organizer Cannot Access Admin Panel

- [ ] Log in as organizer at http://localhost:3000/login (isabelle.leroy@ceva.com / organizer123)
- [ ] Navigate to http://localhost:3000/admin
- [ ] Verify access is **denied** — organizer should see "Unauthorized" or be redirected to admin login
- [ ] The admin panel login form should NOT accept organizer credentials (only admin role)
- [ ] Verify the organizer can still access http://localhost:3000/dashboard normally

## Test 4: Signing URL Uses Unguessable Token

- [ ] Log in as organizer at http://localhost:3000/login
- [ ] Go to dashboard, open an existing open event
- [ ] Find the QR code or signing link section
- [ ] Verify the signing URL format is `/sign/{token}` where token is a ~21 character random string (not a sequential number like `1`, `2`, `3`)
- [ ] Copy the signing URL
- [ ] Open it in a new tab → signing page should load correctly
- [ ] Modify one character in the token (e.g., change the last letter)
- [ ] Try the modified URL → should show "Lien de signature invalide" or similar error
- [ ] Try `/sign/1` (sequential ID) → should NOT work (404 or invalid link)

## Test 5: Token Regeneration Invalidates Old Links

- [ ] From the event detail page, copy the current signing URL
- [ ] Open the signing URL in a new incognito tab → verify it works
- [ ] Back on event detail page, find the "Regenerer le lien" / "Regenerate link" button
- [ ] Click it → confirm the dialog ("Regenerer le lien invalidera l'ancien QR code. Continuer?")
- [ ] After regeneration, verify the signing URL in the UI has changed (different token)
- [ ] Go back to the incognito tab, refresh with the OLD URL → should show invalid link error
- [ ] Open the NEW URL → should load the signing page correctly

## Test 6: HTML/Script Tag Sanitization

- [ ] Open a signing page for an open event
- [ ] In the "Nom" (Last Name) field, enter: `<script>alert('XSS')</script>Dupont`
- [ ] In the "Prenom" (First Name) field, enter: `<b>Jean</b><img onerror=alert(1) src=x>`
- [ ] Fill remaining required fields normally
- [ ] Draw a signature and submit
- [ ] Log in as organizer, go to the event's participant/attendance section
- [ ] Verify the participant name shows as plain text:
  - [ ] Last name: `Dupont` (script tags stripped)
  - [ ] First name: `Jean` (HTML tags stripped, just text preserved)
  - [ ] No alert dialogs appeared at any point
  - [ ] No HTML formatting visible in the name

## Test 7: Image Upload Magic Byte Validation

This test requires creating a fake image file:

- [ ] Create a test file: save a text file containing `this is not an image` as `fake.png`
- [ ] On the signing page, try to submit with this fake file as the signature image (if upload is available)
- [ ] Alternatively, use DevTools > Network to intercept a real signature submission and replace the image data with garbage bytes, then replay
- [ ] Verify the server rejects the upload with an error message
- [ ] Verify that a legitimate PNG/JPEG signature upload still works normally

## Test 8: CSRF Protection

- [ ] Open the signing page for an open event
- [ ] Open DevTools → Network tab
- [ ] Fill out and submit the form normally → verify it succeeds (201 response)
- [ ] In DevTools, right-click the POST request to `/api/participants` → "Copy as cURL"
- [ ] Open a terminal and modify the cURL command: remove the `X-CSRF-Token` header
- [ ] Execute the modified cURL → should get `403 Invalid CSRF token` response
- [ ] Also try: remove the `_csrf` cookie from the cURL → should also get 403
- [ ] Verify the CSRF cookie `_csrf` is visible in DevTools → Application → Cookies:
  - [ ] Cookie name: `_csrf`
  - [ ] `httpOnly`: false (JavaScript needs to read it)
  - [ ] `sameSite`: Strict

## Test 9: Security Headers

- [ ] Open any page (e.g., http://localhost:3000/)
- [ ] Open DevTools → Network tab → click on the page request
- [ ] Check Response Headers for:
  - [ ] `Content-Security-Policy` — should contain `default-src 'self'`, `script-src`, `frame-ancestors 'none'`
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`
  - [ ] `Permissions-Policy` — should contain `camera=(), microphone=(), geolocation=()`
- [ ] Note: `Strict-Transport-Security` (HSTS) is only set in production (NODE_ENV=production)
- [ ] Try embedding the app in an iframe on another page → should be blocked by X-Frame-Options

## Test 10: Rate Limiting & Device Fingerprinting

> **Note:** Rate limiting uses in-memory storage, so it resets when the server restarts.

- [ ] Open the signing page for an open event
- [ ] Submit a signature normally → should succeed without any CAPTCHA
- [ ] Submit 9 more signatures rapidly (refresh page between each, fill form quickly)
- [ ] On the ~11th submission from the same browser:
  - [ ] The form should show a Cloudflare Turnstile CAPTCHA widget
  - [ ] If `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is not configured, CAPTCHA flow may be skipped (dev fallback)
- [ ] Continue submitting past 20 submissions:
  - [ ] Should see a hard block error: "Trop de soumissions. Veuillez reessayer plus tard."
  - [ ] Server returns 429 status

## Test 11: CAPTCHA Server-Side Enforcement

> **Note:** This test requires `TURNSTILE_SECRET_KEY` to be configured. Without it, verification is skipped in dev.

- [ ] Trigger rate limiting (submit ~11 signatures from same browser)
- [ ] When CAPTCHA appears, complete it and verify submission succeeds
- [ ] Using DevTools or cURL, try to submit a POST to `/api/signatures` with:
  - [ ] A valid `X-Device-Fingerprint` header (copy from a real request)
  - [ ] NO `X-Captcha-Token` header
  - [ ] The server should check rate limits and reject: "Verification CAPTCHA requise. Veuillez completer le CAPTCHA."
- [ ] Try with an INVALID `X-Captcha-Token` (random string):
  - [ ] Should be rejected: "Verification CAPTCHA echouee. Veuillez reessayer."

## Test 12: Session Expiry (24 Hours)

> **Note:** This test requires waiting 24 hours or manipulating token expiry.

- [ ] Log in as organizer
- [ ] Verify access to dashboard works
- [ ] Wait 24 hours (or set system clock forward)
- [ ] Try accessing http://localhost:3000/dashboard
- [ ] Should be redirected to login page (session expired)
- [ ] Log in again → new session works

## Test 13: Multi-Day Event Day Selection on Signing Page

- [ ] Create a new event with multiple attendance days (e.g., Feb 20 and Feb 21)
- [ ] Set event status to "open"
- [ ] Open the signing URL
- [ ] Verify a **day selection** step appears (radio buttons or cards with dates)
- [ ] Select one day → form appears with sessions for that day
- [ ] Go back, select the other day → different sessions shown
- [ ] For a single-day event, verify the day is auto-selected (no day selection step)

## Test 14: Organizer Authenticated Bypass for CAPTCHA

- [ ] Log in as organizer
- [ ] Go to an open event's detail page
- [ ] Add a participant via the SIMV search or walk-in flow
- [ ] Verify the participant is created successfully WITHOUT any CAPTCHA challenge
- [ ] This confirms authenticated users bypass the CAPTCHA hook in Participants.ts

---

## Results

| Test | Status | Notes |
|------|--------|-------|
| 1. Password policy enforcement | | |
| 2. Account lockout (5 attempts) | | |
| 3. Organizer blocked from /admin | | |
| 4. Signing URL unguessable tokens | | |
| 5. Token regeneration invalidates old links | | |
| 6. HTML/script tag sanitization | | |
| 7. Image upload magic byte validation | | |
| 8. CSRF protection | | |
| 9. Security headers | | |
| 10. Rate limiting & fingerprinting | | |
| 11. CAPTCHA server-side enforcement | | |
| 12. Session expiry (24h) | | |
| 13. Multi-day event day selection | | |
| 14. Organizer CAPTCHA bypass | | |

**Tested by:**
**Date:**
**Verdict:**
