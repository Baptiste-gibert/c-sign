# Phase 2: Public Signature Flow — Human Verification

**Backend URL:** http://localhost:3000
**Frontend URL:** http://localhost:5173
**Sign URL:** http://localhost:5173/sign/1

## Prerequisites

- Backend running on port 3000 (`cd /workspace/backend && npm run dev`)
- Frontend running on port 5173 (`cd /workspace/frontend && npm run dev`)
- Seed data loaded (`curl http://localhost:3000/api/seed`)

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@ceva.com | Test1234! | Admin |

---

## Test 1: Page Load

- [ ] Open http://localhost:5173/sign/1 in browser
- [ ] Page loads without errors (no blank screen, no JS console errors)
- [ ] Event info visible at top (title, date)
- [ ] Participant form renders with all fields visible
- [ ] Session auto-selected (if single session) or selector visible (if multiple)

## Test 2: Form Validation

- [ ] Click "Signer" without filling any fields
- [ ] Validation errors appear in French:
  - [ ] "Le nom est requis" (or similar) for Nom
  - [ ] "Le prenom est requis" for Prenom
  - [ ] Email error message
  - [ ] "La ville est requise" for Ville
  - [ ] "Le type de beneficiaire est requis" for Type
- [ ] Enter invalid email (e.g., "notanemail") → "Email invalide" shown
- [ ] "La signature est requise" if no signature drawn

## Test 3: Beneficiary Type — Conditional Field

- [ ] Open beneficiary type dropdown
- [ ] Verify 7 options present: ASV, Autre, Eleveur, Etudiant, Pharmacien, Technicien, Veterinaire
- [ ] Select "Autre"
- [ ] "Preciser le type" field appears below
- [ ] Try to submit without filling "Preciser" → validation error shown
- [ ] Select a different type (e.g., Veterinaire) → "Preciser le type" field disappears

## Test 4: Signature Canvas

- [ ] Canvas area is visible with border
- [ ] Draw a signature using mouse (or touch on mobile)
- [ ] Drawing is smooth, no lag
- [ ] "Effacer" button visible below canvas
- [ ] Click "Effacer" → canvas clears completely
- [ ] Draw a new signature

## Test 5: Successful Submission

- [ ] Fill all required fields:
  - [ ] Nom: Dupont
  - [ ] Prenom: Marie
  - [ ] Email: marie@test.com
  - [ ] Ville: Lyon
  - [ ] Type de beneficiaire: Veterinaire
- [ ] Draw a signature on the canvas
- [ ] Optionally check "droit a l'image" consent checkbox
- [ ] Click "Signer"
- [ ] Button shows loading state ("Envoi en cours..." or disabled)
- [ ] Redirected to /success page
- [ ] Success page shows confirmation message (e.g., "Signature enregistree !")
- [ ] If personalized: "Merci Marie !" or similar

## Test 6: Data Verification in Payload Admin

- [ ] Navigate to http://localhost:3000/admin
- [ ] Login with admin@ceva.com / Test1234!
- [ ] Click **Participants** → verify "Dupont Marie" record exists:
  - [ ] email = marie@test.com
  - [ ] city = Lyon
  - [ ] beneficiaryType = veterinaire
- [ ] Click **Media** → verify new signature image exists (PNG, recently created)
- [ ] Click **Signatures** → verify new record exists:
  - [ ] Links to the correct participant (Dupont Marie)
  - [ ] Links to a session
  - [ ] Links to the media (signature image)
  - [ ] rightToImage matches what was checked

## Test 7: QR Code Generation (API)

- [ ] Run: `curl "http://localhost:3000/api/qr-code?dayId=1"`
- [ ] Response contains JSON with:
  - [ ] `qrDataUrl` (base64 PNG data URL starting with `data:image/png`)
  - [ ] `signUrl` (URL like `http://localhost:5173/sign/1`)
  - [ ] `dayId` ("1")

---

## Results

| Test | Status | Notes |
|------|--------|-------|
| 1. Page Load | | |
| 2. Form Validation | | |
| 3. Beneficiary Type | | |
| 4. Signature Canvas | | |
| 5. Successful Submission | | |
| 6. Data Verification | | |
| 7. QR Code API | | |

**Tested by:**
**Date:**
**Verdict:**
