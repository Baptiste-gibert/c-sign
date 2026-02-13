# Phase 1: Foundation & Data Model — Human Verification

**Backend URL:** http://localhost:3000
**Start backend:** `cd /workspace/backend && npm run dev`

## Prerequisites

- Backend running on port 3000
- Seed data loaded (`curl http://localhost:3000/api/seed`)

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@ceva.com | admin123 | Admin |
| isabelle.leroy@ceva.com | organizer123 | Organizer |
| marc.dupont@ceva.com | organizer123 | Organizer |

---

## Test 1: Admin Login & Collections

- [x] Navigate to http://localhost:3000/admin
- [x] Login with `admin@ceva.com` / `admin123`
- [x] Verify admin panel loads successfully
- [x] Verify 7 collections visible in sidebar:
  - [x] Users
  - [x] Events
  - [x] Attendance Days
  - [x] Sessions
  - [x] Participants
  - [x] Signatures
  - [x] Media

## Test 2: Users List

- [x] Click **Users** in sidebar
- [x] Verify 3 users exist
- [x] Verify roles are correct:
  - [x] admin@ceva.com → Admin
  - [x] isabelle.leroy@ceva.com → Organisateur
  - [x] marc.dupont@ceva.com → Organisateur

## Test 3: Event Detail — Multi-Day Non-Consecutive

- [x] Click **Events** in sidebar
- [x] Verify 2 events listed
- [x] Click **"Formation Veterinaires - Q1 2026"**
- [x] Verify fields populated:
  - [x] `selectedDates` shows 3 dates (March 15, 16, 18 — non-consecutive)
  - [x] `attendanceDays` shows 3 linked records (read-only)
  - [x] `expenseType` = Hospitality - Catering
  - [x] `location` = Libourne, France
  - [x] `organizerName` = Isabelle Leroy
  - [x] `organizerEmail` = isabelle.leroy@ceva.com

## Test 4: Attendance Days

- [x] Click **Attendance Days** in sidebar
- [x] Verify 4 total records:
  - [x] 3 for "Formation Veterinaires - Q1 2026" (March 15, 16, 18)
  - [x] 1 for "Reunion Pharmaciens - Bordeaux" (April 10)
- [x] Click one from Event 1
- [x] Verify it links back to the correct event
- [x] Verify date is correct

## Test 5: Sessions

- [x] Click **Sessions** in sidebar
- [x] Verify 3 sessions exist for Day 1 of Event 1:
  - [x] Conference matin
  - [x] Dejeuner
  - [x] Atelier apres-midi

## Test 6: Participants & Beneficiary Type "Autre"

- [x] Click **Participants** in sidebar
- [x] Verify 3 participants:
  - [x] Sophie Martin — Veterinaire (Lyon, VET-12345)
  - [x] Pierre Bernard — Pharmacien (Paris, PHA-67890)
  - [x] Marie Petit — Autre (Toulouse)
- [x] Click **Marie Petit**
- [x] Verify:
  - [x] `beneficiaryType` = Autre
  - [x] `beneficiaryTypeOther` = Consultante (conditional field visible)

## Test 7: Organizer Scoping

- [x] Log out (top-right menu)
- [x] Login with `isabelle.leroy@ceva.com` / `organizer123`
- [x] Click **Events**
- [x] Verify **only** "Formation Veterinaires - Q1 2026" is visible
- [x] Verify "Reunion Pharmaciens - Bordeaux" (Marc's event) is **not** visible

## Test 8: Auto-Generation Hook

- [x] Log out → log back in as `admin@ceva.com` / `admin123`
- [x] Click **Events** → **Create New**
- [x] Fill in:
  - [x] Title: any test name
  - [x] Location: any city
  - [x] Add 2 dates (any dates)
  - [x] Select an expense type
  - [x] Fill organizer name and email
- [x] Click **Save**
- [x] Navigate to **Attendance Days**
- [x] Verify 2 new AttendanceDay records were auto-created for the test event

---

## Results

| Test | Status | Notes |
|------|--------|-------|
| 1. Admin Login & Collections | PASS | 7 collections visible |
| 2. Users List | PASS | 3 users with correct roles |
| 3. Event Detail | PASS | Non-consecutive dates, all fields populated |
| 4. Attendance Days | PASS | 4 records auto-generated correctly |
| 5. Sessions | PASS | 3 sessions linked to Day 1 |
| 6. Participants & Autre | PASS | Conditional field works |
| 7. Organizer Scoping | PASS | Isabelle sees only her event |
| 8. Auto-Generation Hook | PASS | New event auto-creates AttendanceDays |

**Tested by:** Human (manual)
**Date:** 2026-02-13
**Verdict:** PASS
