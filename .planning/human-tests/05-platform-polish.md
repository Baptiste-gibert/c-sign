# Phase 5: Platform Polish — Human Verification

**Backend URL:** http://localhost:3000
**Frontend URL:** http://localhost:5173

## Prerequisites

- Backend running on port 3000 (`cd /workspace/backend && npm run dev`)
- Frontend running on port 5173 (`cd /workspace/frontend && npm run dev`)
- Seed data loaded (`curl http://localhost:3000/api/seed`)
- At least one event exists with status "open" and at least one attendance day

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@ceva.com | Test1234! | Admin |

---

## Test 1: Language Switching (Desktop)

- [ ] Visit http://localhost:5173/login
- [ ] Verify all text is in French by default (labels, buttons, descriptions)
- [ ] Log in as organizer (admin@ceva.com / Test1234!)
- [ ] Find the LanguageSwitcher button in the header (should show "EN")
- [ ] Click it — ALL text switches to English instantly:
  - [ ] Navigation links ("Events", "New Event", "Logout")
  - [ ] Page title ("My Events")
  - [ ] Table headers ("Title", "Location", "Dates", "Expense Type", "Status", "Actions")
  - [ ] Status badges ("Draft", "Open", "Finalized")
- [ ] Refresh the page — language should still be English (localStorage persistence)
- [ ] Click the switcher again — should return to French
- [ ] Navigate: Dashboard → Event Detail → Event Create — all pages show correct language

## Test 2: Public Flow Language (Desktop)

- [ ] Visit http://localhost:5173/sign/{dayId} (use a day ID from an open event)
- [ ] Verify form labels are in French by default:
  - [ ] "Nom", "Prénom", "Email", "Ville"
  - [ ] "Type de bénéficiaire", "Signature"
  - [ ] "Feuille de présence" title
- [ ] Find the LanguageSwitcher and switch to English
- [ ] All labels update to English:
  - [ ] "Last Name", "First Name", "Email", "City"
  - [ ] "Beneficiary Type", "Signature"
  - [ ] "Attendance Sheet" title
- [ ] Signature canvas placeholder changes ("Sign here" / "Signez ici")
- [ ] Switch back to French — everything reverts

## Test 3: Mobile Responsive — Public Flow (DevTools)

- [ ] Open Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
- [ ] Select iPhone SE (375x667) or set custom 320px width
- [ ] Visit http://localhost:5173/sign/{dayId}
- [ ] Form fits entirely within screen — no horizontal scroll
- [ ] All inputs have adequate touch target size (visually ≥44px height)
- [ ] Signature canvas is visible and appropriately sized (shorter than desktop)
- [ ] Submit button is full-width and easily tappable
- [ ] Beneficiary type dropdown opens correctly on mobile
- [ ] Try different phone sizes:
  - [ ] iPhone 12/13 (390px)
  - [ ] Galaxy S21 (360px)
  - [ ] Custom 320px — smallest supported

## Test 4: Mobile Responsive — Organizer Flow (DevTools)

- [ ] Set DevTools to iPad (768px width)
- [ ] Visit http://localhost:5173/login → log in
- [ ] Dashboard: Table shows most columns, no horizontal overflow
- [ ] Set to iPhone (375px width):
  - [ ] Table hides "Location" and "Expense Type" columns
  - [ ] Remaining columns (Title, Dates, Status, Actions) are readable
- [ ] Event Detail page:
  - [ ] Cards stack vertically
  - [ ] QR codes display in single column
  - [ ] Walk-in form fields stack on mobile (1 column, not 2)
- [ ] Navigation header remains usable (may wrap but not overflow)
- [ ] Event Create page: Form usable, calendar doesn't overflow

## Test 5: Signature Canvas Mobile

- [ ] In DevTools mobile mode (375px), visit sign page
- [ ] Canvas is shorter than desktop version
- [ ] Use mouse to simulate drawing — canvas responds to input
- [ ] Clear button works and clears the canvas
- [ ] Drawing stays within canvas bounds
- [ ] If possible: test on a real phone via local network IP

## Test 6: Validation Messages in Both Languages

- [ ] On sign page, switch to English
- [ ] Submit the form without filling any fields
- [ ] Validation errors appear in English ("Last name is required", etc.)
- [ ] Switch to French, submit again
- [ ] Validation errors appear in French ("Le nom est requis", etc.)
- [ ] On login page, enter wrong credentials
- [ ] Error message matches current language

## Test 7: End-to-End Bilingual Flow

- [ ] Switch to English via LanguageSwitcher
- [ ] Complete full signing flow in English:
  - [ ] Fill all form fields
  - [ ] Draw signature
  - [ ] Submit
  - [ ] Success page text is in English ("Thank you", "Signature recorded")
- [ ] Return to organizer dashboard (in English)
- [ ] Verify the new signature appears in the attendance dashboard
- [ ] Attendance labels are in English ("present", "Signed", etc.)

---

## Results

| Test | Status | Notes |
|------|--------|-------|
| 1. Language Switching (Desktop) | | |
| 2. Public Flow Language (Desktop) | | |
| 3. Mobile Responsive — Public Flow | | |
| 4. Mobile Responsive — Organizer Flow | | |
| 5. Signature Canvas Mobile | | |
| 6. Validation Messages in Both Languages | | |
| 7. End-to-End Bilingual Flow | | |

**Tested by:**
**Date:**
**Verdict:**
