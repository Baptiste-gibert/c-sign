# Roadmap: c-sign

## Overview

c-sign delivers digital attendance tracking in six phases, moving from foundational data architecture through public signature capture, organizer workflows, compliance export, and platform polish. The journey follows a critical path: establish the multi-day event model and collections first (Phase 1), build the public signing flow that replaces PowerApps (Phase 2), enable organizers to create and manage events (Phase 3), deliver XLSX export and email for compliance reporting (Phase 4), add bilingual UI and mobile optimization (Phase 5), and finally implement advanced features like event history and reopening (Phase 6).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Data Model** - Payload collections, auth, per-day attendance architecture
- [x] **Phase 2: Public Signature Flow** - QR codes, signature canvas, public form (no login)
- [x] **Phase 3: Event Management** - Organizer dashboard, event CRUD, participant lists
- [ ] **Phase 4: Export & Email** - XLSX generation with embedded signatures, email delivery
- [ ] **Phase 5: Platform Polish** - Bilingual UI (FR/EN), mobile-first responsive design
- [ ] **Phase 6: Advanced Features** - Event history, reopening, walk-ins, CNOV metadata

## Phase Details

### Phase 1: Foundation & Data Model
**Goal**: Core Payload CMS infrastructure and data model are configured correctly for multi-day events with per-day attendance tracking.
**Depends on**: Nothing (first phase)
**Requirements**: PLAT-02 (organizer authentication), EVNT-06 (per-day attendance), PART-05 (beneficiary type)
**Success Criteria** (what must be TRUE):
  1. Payload CMS is running with PostgreSQL connected
  2. Organizer can create account and log into Payload admin UI
  3. Event with date range auto-generates one AttendanceDay record per day
  4. Participant record includes beneficiary type taxonomy (Veterinarian, Pharmacist, Student, ASV, Technician, Farmer, Other)
  5. Signature can be associated with AttendanceDay and stored as Media file
**Plans:** 3 plans

Plans:
- [ ] 01-01-PLAN.md — Backend scaffold with Payload CMS 3.x, Users collection with Admin/Organizer roles, access control functions
- [ ] 01-02-PLAN.md — Domain collections (Events, AttendanceDays, Sessions, Participants, Signatures) with afterChange hook
- [ ] 01-03-PLAN.md — Seed data for development/testing and end-to-end admin UI verification

### Phase 2: Public Signature Flow
**Goal**: External participants can scan QR code and submit signature on their phone without logging in.
**Depends on**: Phase 1
**Requirements**: SIGN-01 (QR code generation), SIGN-02 (scan QR, no login), SIGN-03 (participant form), SIGN-04 (signature canvas), SIGN-05 (immediate upload), SIGN-06 (right-to-image consent), SIGN-07 (confirmation)
**Success Criteria** (what must be TRUE):
  1. Organizer can generate QR code linked to specific attendance day
  2. Participant scans QR code and opens signing form on mobile device without login
  3. Participant fills form with: last name, first name, email, city, registration number, beneficiary type
  4. Participant draws signature on touch-based canvas that works on iOS Safari and Android Chrome
  5. Signature uploads immediately to server as image file (not stored in client memory)
  6. Participant can check right-to-image consent checkbox
  7. Participant sees success confirmation after submission
**Plans:** 4 plans

Plans:
- [ ] 02-01-PLAN.md — Frontend scaffold: Vite + React 19 + Tailwind v4 + shadcn/ui + React Router + API proxy
- [ ] 02-02-PLAN.md — Backend public access control updates + QR code generation endpoint
- [ ] 02-03-PLAN.md — Public signing page: participant form, signature canvas, submission flow, success page
- [ ] 02-04-PLAN.md — End-to-end human verification of the complete signing flow

### Phase 3: Event Management
**Goal**: Organizers can create events, manage participant lists, and monitor attendance in real-time.
**Depends on**: Phase 2
**Requirements**: EVNT-01 (create event), EVNT-03 (expense type), EVNT-04 (status workflow), EVNT-07 (event history), PART-01 (pre-populate participants), PART-02 (SIMV registry search), PART-03 (add/remove participants), PART-04 (walk-in participants)
**Success Criteria** (what must be TRUE):
  1. Organizer can create event with: name, date range (from/to), expense type, organizer name, location
  2. Organizer can select expense type from: Hospitality-snack, Hospitality-catering, Hospitality-accommodation, Event registration fees, Meeting/organization fees, Transport fees
  3. Organizer can search mock SIMV registry by name or registration number to add participants
  4. Organizer can pre-populate participant list before event starts
  5. Organizer can add/remove participants from list
  6. Event transitions through: draft -> open -> finalized status workflow
  7. Organizer can view list of past events
  8. Organizer can see real-time attendance dashboard showing who has signed
**Plans:** 5 plans

Plans:
- [ ] 03-01-PLAN.md — Backend schema updates (status field, participants relationship) + frontend deps + MSW mock SIMV registry
- [ ] 03-02-PLAN.md — Auth flow (login page, useAuth hook, ProtectedRoute, OrganizerLayout shell)
- [ ] 03-03-PLAN.md — Event CRUD (creation form with DateSelector, dashboard page with event list)
- [ ] 03-04-PLAN.md — Event detail with participant management (SIMV search, add/remove, walk-ins) + attendance dashboard
- [ ] 03-05-PLAN.md — End-to-end automated checks + human verification of complete organizer workflow

### Phase 4: Export & Email
**Goal**: Organizers can finalize events and receive XLSX export with embedded signatures via email.
**Depends on**: Phase 3
**Requirements**: EXPO-01 (XLSX export), EXPO-02 (auto-email), EXPO-03 (organizer email recipient), EXPO-04 (manual download), PLAT-04 (image optimization)
**Success Criteria** (what must be TRUE):
  1. Organizer can finalize event which triggers XLSX generation
  2. XLSX includes: participant data, attendance day, signature images embedded in cells
  3. Signature images are optimized to 200x100px before embedding (prevent file size bloat)
  4. System auto-emails XLSX to transparence@ceva.com and organizer's email address
  5. Organizer can manually download XLSX from dashboard
  6. XLSX file size stays under 8MB for 50+ participant events
**Plans:** 2 plans

Plans:
- [ ] 04-01-PLAN.md — Backend export pipeline: XLSX generation with ExcelJS, Sharp image optimization, email delivery via Nodemailer adapter, download endpoint
- [ ] 04-02-PLAN.md — Frontend download button on EventDetailPage + end-to-end human verification

### Phase 5: Platform Polish
**Goal**: UI is bilingual (French/English) and mobile-first responsive across all devices.
**Depends on**: Phase 4
**Requirements**: PLAT-01 (mobile-first responsive), PLAT-03 (bilingual FR/EN)
**Success Criteria** (what must be TRUE):
  1. User can toggle between French and English language with persistent preference
  2. All UI text (labels, buttons, messages, errors) displays in selected language
  3. Public signing form is fully usable on smartphone screens (320px width minimum)
  4. Organizer dashboard is fully usable on tablet and desktop screens
  5. Signature canvas works reliably on iOS Safari, Android Chrome, desktop browsers
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Advanced Features
**Goal**: Organizers can reopen finalized events, add CNOV numbers, and manage walk-in participants on-site.
**Depends on**: Phase 5
**Requirements**: EVNT-02 (CNOV number), EVNT-05 (reopen event), PART-04 (walk-in participants)
**Success Criteria** (what must be TRUE):
  1. Organizer can set CNOV declaration number on event
  2. Organizer can reopen finalized event to add late participants
  3. When event is reopened, existing signatures are preserved
  4. Organizer can add walk-in participants on-site during event
  5. Walk-in participant addition shows confirmation and updates attendance dashboard
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Model | 3/3 | ✓ Complete | 2026-02-13 |
| 2. Public Signature Flow | 4/4 | ✓ Complete | 2026-02-13 |
| 3. Event Management | 5/5 | ✓ Complete | 2026-02-13 |
| 4. Export & Email | 0/2 | Not started | - |
| 5. Platform Polish | 0/TBD | Not started | - |
| 6. Advanced Features | 0/TBD | Not started | - |
