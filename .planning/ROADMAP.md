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
- [x] **Phase 4: Export & Email** - XLSX generation with embedded signatures, email delivery
- [x] **Phase 5: Platform Polish** - Bilingual UI (FR/EN), mobile-first responsive design
- [x] **Phase 6: Advanced Features** - Event history, reopening, walk-ins, CNOV metadata
- [ ] **Phase 7: UI Design & Style Guide Application** - Dark-mode themed, per-event color customization (96% complete)
- [x] **Phase 8: Security & Access** - Auth hardening, signing tokens, input sanitization, rate limiting, CSRF
- [ ] **Phase 9: Code Quality** - ESLint strict config, Prettier, dependency audit, pre-commit hooks

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
**Plans:** 3 plans

Plans:
- [ ] 05-01-PLAN.md — i18n infrastructure: react-i18next setup, translation JSON files (3 namespaces x 2 languages), LanguageSwitcher component
- [ ] 05-02-PLAN.md — Replace all hardcoded French strings with t() calls across every component
- [ ] 05-03-PLAN.md — Mobile-first responsive audit + human verification of bilingual + responsive experience

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
**Plans:** 3 plans

Plans:
- [ ] 06-01-PLAN.md — Backend reopen status lifecycle, CNOV in XLSX export, re-finalization email handling
- [ ] 06-02-PLAN.md — Frontend reopen UI, CNOV display, SignPage/DashboardPage updates, bilingual translations, walk-in UX
- [ ] 06-03-PLAN.md — [GAP CLOSURE] Add CNOV input to event creation form + inline CNOV edit on event detail page

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Model | 3/3 | ✓ Complete | 2026-02-13 |
| 2. Public Signature Flow | 4/4 | ✓ Complete | 2026-02-13 |
| 3. Event Management | 5/5 | ✓ Complete | 2026-02-13 |
| 4. Export & Email | 2/2 | ✓ Complete | 2026-02-14 |
| 5. Platform Polish | 3/3 | ✓ Complete | 2026-02-14 |
| 6. Advanced Features | 3/3 | ✓ Complete | 2026-02-14 |
| 7. UI Design & Style Guide | 3/3 | ✓ Complete | 2026-02-14 |
| 8. Security & Access | 7/7 | ✓ Complete | 2026-02-15 |

### Phase 7: UI Design & Style Guide Application

**Goal**: Public signing pages are styled with the C-SIGN Design System v2.0 (dark-mode themed, per-event color customization via 4 built-in palettes + custom accent generator).
**Depends on**: Phase 6
**Requirements**: None (post-v1 visual polish — no new functional requirements)
**Success Criteria** (what must be TRUE):
  1. Public signing page uses dark-mode themed design with CSS custom properties per the design system
  2. 4 built-in color palettes available (Tech Modern, Vibrant Purple, Nature Teal, Energy Orange)
  3. Organizer can select a theme or custom accent color per event
  4. Public signing page renders using the event's chosen theme
  5. Theme generation algorithm derives full palette from a single accent color
  6. Typography follows Inter font stack with defined scale (h1: 30px, body: 13px, label: 10px)
  7. WCAG AA contrast ratios maintained across all generated themes
**Plans:** 4 plans

Plans:
- [ ] 07-01-PLAN.md — Theme infrastructure: generateTheme algorithm, 4 built-in palettes, ThemeProvider context, backend theme field, Inter font
- [ ] 07-02-PLAN.md — Public page restyling: SignPage, ParticipantForm, SignatureCanvas, SuccessPage with dark-mode design system
- [ ] 07-03-PLAN.md — Organizer theme selector: ThemeSelector component, EventForm and EventDetailPage integration, translations
- [ ] 07-04-PLAN.md — End-to-end human verification of complete theme system across all 4 palettes

### Phase 8: Security & Access

**Goal:** Application is hardened for public deployment with defense-in-depth security: auth lockout, unguessable signing URLs, input sanitization, device-based rate limiting, CSRF protection, and production-safe configuration.
**Depends on:** Phase 7
**Plans:** 7 plans

**Success Criteria** (what must be TRUE):
  1. Organizer sessions expire after 24 hours with strict cookie security
  2. Accounts lock after 5 failed login attempts (admin-only unlock)
  3. Passwords require 8+ chars, mixed case, at least one number
  4. Organizers cannot access Payload admin panel (admin-only)
  5. Public signing URLs use unguessable tokens (not sequential IDs)
  6. Organizer can regenerate signing token to invalidate compromised links
  7. Participant text inputs are sanitized server-side (HTML/script tags stripped)
  8. Image uploads validated by magic bytes, re-encoded through Sharp
  9. CSRF tokens protect all state-changing API requests
  10. Security headers (CSP, HSTS, X-Frame-Options) on all responses
  11. Device fingerprint-based rate limiting detects abuse
  12. Dynamic CAPTCHA triggers only on suspicious submission volume

Plans:
- [ ] 08-01-PLAN.md — Auth hardening: session expiry, lockout, password policy, admin-only panel, production config
- [ ] 08-02-PLAN.md — Input sanitization and upload safety: HTML stripping, magic byte validation, Sharp re-encoding
- [ ] 08-03-PLAN.md — Security middleware: HTTP headers (CSP, HSTS), CSRF protection, API fetch updates
- [ ] 08-04-PLAN.md — Signing tokens backend: nanoid generation, Events signingToken field, QR code update
- [ ] 08-05-PLAN.md — Signing tokens frontend: URL migration to /sign/[token], organizer UI updates, regeneration
- [ ] 08-06-PLAN.md — Rate limiting and CAPTCHA: device fingerprinting, Turnstile integration, abuse detection
- [ ] 08-07-PLAN.md — [GAP CLOSURE] Server-side CAPTCHA verification in Signatures and Participants collection hooks

### Phase 9: Code Quality

**Goal:** Automated code quality tooling (ESLint strict, Prettier, depcheck) with strict enforcement and zero violations across the entire codebase, plus pre-commit hooks for continuous enforcement.
**Depends on:** Phase 8
**Plans:** 3 plans

**Success Criteria** (what must be TRUE):
  1. ESLint 9 flat config with typescript-eslint/strict produces zero errors
  2. Prettier formats all files with zero violations
  3. TypeScript compiles clean with strict mode
  4. No eslint-disable comments exist in the codebase
  5. All unused dependencies removed from package.json
  6. Pre-commit hook enforces linting and formatting on every commit

Plans:
- [ ] 09-01-PLAN.md — Tooling setup: install deps, ESLint 9 flat config, Prettier config, npm scripts, format codebase
- [ ] 09-02-PLAN.md — Fix all ESLint violations: auto-fix + manual fixes for 26 `any` types and remaining errors
- [ ] 09-03-PLAN.md — Dependency audit with depcheck + husky/lint-staged pre-commit hooks
