# Phase 3: Event Management — Human Verification

**Backend URL:** http://localhost:3000
**Frontend URL:** http://localhost:5173
**Dashboard URL:** http://localhost:5173/dashboard

## Prerequisites

- Backend running on port 3000 (`cd /workspace/backend && npm run dev`)
- Frontend running on port 5173 (`cd /workspace/frontend && npm run dev`)
- Seed data loaded (`curl http://localhost:3000/api/seed`)

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@ceva.com | admin123 | Admin/Organizer |

---

## Test 1: Login Flow

- [ ] Open http://localhost:5173/login
- [ ] Page loads with email and password fields
- [ ] Enter invalid credentials → error message displayed
- [ ] Enter: admin@ceva.com / Test1234!
- [ ] Click login button
- [ ] Redirected to /dashboard
- [ ] Navigation header shows user name and "Deconnexion" button

## Test 2: Protected Routes

- [ ] Open a private/incognito window
- [ ] Navigate to http://localhost:5173/dashboard
- [ ] Redirected to /login (not authenticated)
- [ ] Navigate to http://localhost:5173/events/new
- [ ] Also redirected to /login

## Test 3: Event List Dashboard

- [ ] After login, verify /dashboard loads
- [ ] Seeded events are displayed in a table/list
- [ ] Each event shows: title, location, dates, expense type, status badge
- [ ] Status badges use colors (e.g., draft = gray, open = blue/green)
- [ ] "Nouvel evenement" button is visible

## Test 4: Event Creation

- [ ] Click "Nouvel evenement" button
- [ ] Event creation form loads with fields:
  - [ ] Titre (title)
  - [ ] Lieu (location)
  - [ ] Nom de l'organisateur (pre-filled from auth user)
  - [ ] Email de l'organisateur (pre-filled from auth user)
  - [ ] Type de depense (expense type dropdown)
- [ ] Open expense type dropdown — verify all 6 options present:
  - [ ] Hospitalite-collation
  - [ ] Hospitalite-restauration
  - [ ] Hospitalite-hebergement
  - [ ] Frais d'inscription evenement
  - [ ] Frais de reunion/organisation
  - [ ] Frais de transport
- [ ] Select an expense type
- [ ] Calendar/date selector is visible
- [ ] Select 2 non-consecutive dates (click two separate days)
- [ ] Both dates appear in the selected dates list
- [ ] Click "Creer l'evenement" (or submit button)
- [ ] Redirected to event detail page
- [ ] Navigate back to /dashboard
- [ ] Newly created event appears in the event list

## Test 5: Event Detail Page

- [ ] Click on an event in the dashboard list
- [ ] Event detail page loads showing:
  - [ ] Event title
  - [ ] Event dates
  - [ ] Event status (draft)
  - [ ] Participant section
  - [ ] Attendance section

## Test 6: Participant Search (SIMV Mock)

- [ ] On event detail page, find participant search input
- [ ] Type 2+ characters of a name (e.g., "Dup" or "Mar")
- [ ] Search results dropdown appears with mock SIMV registry data
- [ ] Results show name and registration number
- [ ] Click on a result to add participant
- [ ] Participant appears in the participant table
- [ ] Search for and add 2 more participants
- [ ] All 3 participants visible in the table with: name, email, city, type, registration number

## Test 7: Remove Participant

- [ ] Find remove/delete button on a participant row
- [ ] Click remove
- [ ] Participant removed from the table
- [ ] Remaining participants still displayed correctly

## Test 8: Walk-In Participant

- [ ] Find walk-in / manual participant add form
- [ ] Enter participant details manually:
  - [ ] Nom: TestWalkin
  - [ ] Prenom: Jean
  - [ ] Email: jean@test.com
  - [ ] Ville: Paris
  - [ ] Type de beneficiaire: select one
- [ ] Click add button
- [ ] Walk-in participant appears in the participant table

## Test 9: Status Workflow — Draft to Open

- [ ] Verify event status shows "Brouillon" (draft)
- [ ] Find "Ouvrir l'evenement" button (or similar)
- [ ] Click to open the event
- [ ] Status updates to "Ouvert" (open)
- [ ] QR codes become visible (one per attendance day)

## Test 10: QR Code Display

- [ ] With event in "open" status, find QR code section
- [ ] QR code(s) displayed for each attendance day
- [ ] Click/open a QR code → shows signing URL
- [ ] Copy/open the signing URL in a new tab
- [ ] Public signing form loads (from Phase 2)

## Test 11: Attendance Dashboard

- [ ] On event detail page, find attendance dashboard section
- [ ] Shows attendance days with session breakdown
- [ ] Shows 0/N participants signed (initially zero)
- [ ] (Optional) Submit a signature via the QR code URL in another tab
- [ ] Return to event detail page
- [ ] Attendance count updates (may take up to 10 seconds due to polling)
- [ ] Shows 1/N signed with progress indicator

## Test 12: Status Workflow — Open to Finalized

- [ ] With event in "open" status, find "Finaliser" button
- [ ] Click to finalize the event
- [ ] Confirm if confirmation dialog appears
- [ ] Status updates to "Finalise"
- [ ] Participant add/remove controls become disabled or hidden
- [ ] Event is now read-only

## Test 13: Invalid Status Transition

- [ ] Try to revert a finalized event (if button exists)
- [ ] User-friendly error message displayed
- [ ] Status remains "Finalise"

## Test 14: Logout

- [ ] Click "Deconnexion" in the navigation header
- [ ] Redirected to /login
- [ ] Try navigating directly to /dashboard
- [ ] Redirected back to /login (session cleared)

---

## Results

| Test | Status | Notes |
|------|--------|-------|
| 1. Login Flow | ✓ Pass | Password was admin123, not Test1234! |
| 2. Protected Routes | ✓ Pass | |
| 3. Event List Dashboard | ✓ Pass | |
| 4. Event Creation | ✓ Pass | |
| 5. Event Detail Page | ✓ Pass | |
| 6. Participant Search | ✓ Pass | |
| 7. Remove Participant | ✓ Pass | |
| 8. Walk-In Participant | ✓ Pass | |
| 9. Status Draft → Open | ✓ Pass | |
| 10. QR Code Display | ✓ Pass | |
| 11. Attendance Dashboard | ✓ Pass | |
| 12. Status Open → Finalized | ✓ Pass | |
| 13. Invalid Status Transition | ✓ Pass | |
| 14. Logout | ✓ Pass | |

**Tested by:** Baptiste Gibert
**Date:** 2026-02-13
**Verdict:** PASS

## Bugs Found & Fixed During Testing

1. **Missing sessions on new events** — `afterEventChange` hook created AttendanceDays but not Sessions. Fixed: auto-creates "Session principale" per new AttendanceDay.
2. **Signing allowed on finalized events** — No status check on public sign page or backend. Fixed: backend rejects signatures for non-open events, frontend hides form and shows status message.
