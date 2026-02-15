# Smoke Test — Run Before All Phase Tests

**App URL:** http://localhost:3000
**Purpose:** Validate the server is healthy and core flows work before running deeper phase-specific tests. If any smoke test fails, stop and fix before proceeding.
**Expected time:** ~5 minutes

## Setup

```bash
cd /workspace/backend && npm run dev
```

Wait for `Ready in Xs` message, then seed:

```bash
curl http://localhost:3000/api/seed
```

Expected: `Seed data already exists` or `Seed completed`.

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@ceva.com | admin123 | Admin |
| isabelle.leroy@ceva.com | organizer123 | Organizer |

---

## S1: Server Responds

- [ ] Open http://localhost:3000/ — page loads without 500 error
- [ ] Open http://localhost:3000/admin — Payload admin login page appears
- [ ] Open http://localhost:3000/login — organizer login page appears
- [ ] No terminal crash or unhandled exception in the `npm run dev` console

## S2: API Health

- [ ] Open http://localhost:3000/api/users/me — returns JSON (401 or user object)
- [ ] Open http://localhost:3000/api/events?limit=1 — returns JSON with `docs` array
- [ ] Open http://localhost:3000/api/attendance-days?limit=1 — returns JSON with `docs` array
- [ ] No 500 errors on any API route

## S3: Admin Login

- [ ] Go to http://localhost:3000/admin/login
- [ ] Log in as `admin@ceva.com` / `admin123`
- [ ] Admin panel loads — collections visible in sidebar (Users, Events, Attendance Days, Sessions, Participants, Signatures, Media)
- [ ] Log out

## S4: Organizer Login

- [ ] Go to http://localhost:3000/login
- [ ] Log in as `isabelle.leroy@ceva.com` / `organizer123`
- [ ] Redirected to http://localhost:3000/dashboard
- [ ] Event list loads (at least the seed events visible)
- [ ] Click on an event — detail page loads without error

## S5: Public Signing Page

- [ ] From the event detail page, find the signing link or QR section
- [ ] Copy the signing URL (format: `/sign/{token}`)
- [ ] Open it in a new incognito/private window (not logged in)
- [ ] Signing page loads with event title, date, and form fields
- [ ] Form fields visible: Nom, Prenom, Email, Ville, Numero professionnel, Type de beneficiaire
- [ ] Signature canvas visible and drawable

## S6: End-to-End Signature Submission

- [ ] On the signing page (incognito window), fill in:
  - Nom: `Smoke`
  - Prenom: `Test`
  - Email: `smoke@test.com`
  - Ville: `Paris`
  - Type de beneficiaire: any option
- [ ] Draw a signature on the canvas
- [ ] Click submit
- [ ] Success page appears ("Merci" / "Thank you")
- [ ] No errors in the browser console (DevTools > Console)

## S7: Signature Visible in Dashboard

- [ ] Go back to the organizer window (logged in)
- [ ] Refresh the event detail page
- [ ] The attendance section shows the new signature (participant: Smoke Test)
- [ ] Signature image thumbnail visible

## S8: Database Writes Working

- [ ] In the organizer dashboard, click "New Event" / "Nouvel evenement"
- [ ] Fill minimum required fields (title, dates, expense type, location, organizer name)
- [ ] Save — event created without error
- [ ] Event appears in the dashboard list
- [ ] Delete or leave this test event (it won't affect other tests)

---

## Results

| Test | Status | Notes |
|------|--------|-------|
| S1. Server responds | | |
| S2. API health | | |
| S3. Admin login | | |
| S4. Organizer login | | |
| S5. Public signing page | | |
| S6. E2E signature submission | | |
| S7. Signature in dashboard | | |
| S8. Database writes | | |

**All pass?** If yes, proceed to phase-specific test plans (01 through 08).
**Any fail?** Stop. Check terminal logs, fix the issue, restart server, re-run smoke tests.

**Tested by:**
**Date:**
