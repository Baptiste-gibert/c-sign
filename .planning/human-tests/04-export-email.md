# Phase 4: Export & Email — Human Verification

**Backend URL:** http://localhost:3000
**Frontend URL:** http://localhost:5173

## Prerequisites

- Backend running on port 3000 (`cd /workspace/backend && npm run dev`)
- Frontend running on port 5173 (`cd /workspace/frontend && npm run dev`)
- Seed data loaded (`curl http://localhost:3000/api/seed`)
- At least one event exists with status "open" and at least one signed participant

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@ceva.com | Test1234! | Admin |

---

## Test 1: Download Button Visibility

- [ ] Log in at http://localhost:5173 as organizer
- [ ] Navigate to an event with status **"Brouillon"** (draft)
  - [ ] Verify NO "Telecharger XLSX" button is visible
- [ ] Navigate to an event with status **"Ouvert"** (open)
  - [ ] Verify NO "Telecharger XLSX" button is visible
- [ ] Navigate to an event with status **"Finalise"** (finalized)
  - [ ] Verify "Telecharger XLSX" button IS visible

## Test 2: Finalize an Event

- [ ] Navigate to an **open** event that has at least one signature
  - If none exists: create event, open it, scan QR code at /sign/{dayId}, submit a signature, return to event detail
- [ ] Click **"Finaliser"** button
- [ ] Confirm the finalization dialog
- [ ] Event status changes to "Finalise"
- [ ] "Telecharger XLSX" button now appears on the page

## Test 3: XLSX Download

- [ ] On the finalized event, click **"Telecharger XLSX"**
- [ ] Button shows loading state ("Generation..." with spinner)
- [ ] A `.xlsx` file downloads to your machine
- [ ] Filename follows pattern: `feuille-presence-{event-title}-{date}.xlsx`
- [ ] File size is reasonable (well under 8MB)

## Test 4: XLSX Content Verification

Open the downloaded XLSX in Excel, LibreOffice, or Google Sheets:

- [ ] **Header rows** present with event info:
  - [ ] Event title
  - [ ] Location
  - [ ] Organizer name
  - [ ] Expense type
- [ ] **Column headers** on row 4 (bold, gray background):
  - [ ] Nom, Prenom, Email, Ville, N inscription, Type beneficiaire, Date, Session, Droit image, Signature
- [ ] **Participant data rows** with correct information:
  - [ ] Last name, first name, email, city filled correctly
  - [ ] Professional number present (if participant has one)
  - [ ] Beneficiary type matches what was submitted
  - [ ] Date formatted as dd/mm/yyyy
  - [ ] Session name present
  - [ ] Droit image shows "Oui" or "Non"
- [ ] **Signature images** embedded in the Signature column:
  - [ ] Images visible in cells (not broken image placeholders)
  - [ ] Images are small/optimized (not oversized)
  - [ ] One image per signed participant row

## Test 5: Export API Endpoint (Direct)

- [ ] In terminal, run:
  ```bash
  # First get auth cookie
  curl -c cookies.txt -X POST http://localhost:3000/api/users/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@ceva.com","password":"Test1234!"}'

  # Then download export (replace {ID} with a finalized event ID)
  curl -b cookies.txt -o export-test.xlsx http://localhost:3000/api/events/{ID}/export
  ```
- [ ] File downloads successfully (non-empty .xlsx)
- [ ] Without auth cookie: returns 401 Unauthorized
- [ ] With non-finalized event ID: returns 400 error message

## Test 6: Email Send Attempt (Log Verification)

- [ ] Check backend terminal output after finalization
- [ ] Logs should show:
  - [ ] XLSX generation message with file size in MB
  - [ ] Email send attempt (to transparence@ceva.com and organizer email)
  - [ ] Email may fail (no SMTP configured in dev) — this is expected
- [ ] The finalization itself should NOT be blocked by email failure

## Test 7: Multiple Participants Export

- [ ] If possible, finalize an event with 2+ signed participants
- [ ] Download XLSX
- [ ] Verify multiple data rows present (one per signature)
- [ ] Each row has its own embedded signature image
- [ ] All participant data is correct across rows

---

## Results

| Test | Status | Notes |
|------|--------|-------|
| 1. Download Button Visibility | ✓ Pass | |
| 2. Finalize an Event | ✓ Pass | |
| 3. XLSX Download | ✓ Pass | |
| 4. XLSX Content Verification | ✓ Pass | Required 3 bug fixes: query sessions/signatures directly + overrideAccess |
| 5. Export API Endpoint | ✓ Pass | |
| 6. Email Send Attempt | ✓ Pass | SMTP connection refused in dev (expected) |
| 7. Multiple Participants Export | ✓ Pass | |

**Tested by:** Baptiste Gibert
**Date:** 2026-02-14
**Verdict:** PASS
