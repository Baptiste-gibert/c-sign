# c-sign — Feuille de Présence Digitale

## What This Is

A web application that replaces paper-based attendance sheets for Ceva Santé Animale's events (business meetings, training sessions, meals with veterinary professionals). Organizers create events in a back-office, share a QR code, and participants sign on their own phone. Built on Payload CMS 3.x + Vite/React 19, running in Docker.

## Core Value

Organizers can collect legally-valid digital signatures from external participants (veterinarians, pharmacists) on any device, without requiring them to log in or install anything.

## Requirements

### Validated

<!-- Existing stack capabilities confirmed from codebase -->

- ✓ Payload CMS 3.x backend with REST API auto-generation — existing
- ✓ Vite + React 19 + Tailwind v4 frontend SPA — existing
- ✓ PostgreSQL 16 database — existing
- ✓ Docker Compose dev environment — existing
- ✓ Payload admin UI at /admin — existing
- ✓ Vite proxy to Payload API — existing

### Active

- [ ] Event creation with full metadata (name, dates, expense type, organizer, location, CNOV number)
- [ ] Per-day attendance tracking for multi-day events
- [ ] Participant management with SIMV registry search (mocked for MVP)
- [ ] Pre-populate participant lists before events
- [ ] QR code generation for participant self-service signing
- [ ] Handwritten digital signature capture (touch-based canvas)
- [ ] Immediate server-side signature storage (image upload via Payload Media)
- [ ] Right-to-image consent checkbox per participant
- [ ] Event history with reopen/modify (existing signatures preserved)
- [ ] XLSX export of finalized attendance sheets
- [ ] Auto-email of XLSX to transparence@ceva.com + organizer email
- [ ] Manual XLSX download option
- [ ] Organizer authentication via Payload built-in auth
- [ ] Bilingual UI (French + English)
- [ ] Mobile-first responsive design (participants sign on phones)

### Out of Scope

- Real SIMV API integration — using mock data for MVP, real integration later
- OAuth / SSO / Keycloak — Payload built-in auth sufficient for MVP
- Mobile native app — PWA-capable web app is sufficient
- Real-time collaboration — not needed, one organizer per event
- Video/photo uploads — only signatures as images
- Payment processing — no financial transactions
- CI/CD pipelines — manual deployment for now
- Production infrastructure (Kong, Kubernetes, Grafana) — Docker Compose only

## Context

**Business context:** Ceva Santé Animale (Transparency & Market Intelligence department) handles ~20 BU events and ~800 meals with veterinarians per year, generating 5,000–10,000 attendance records. Paper sheets are lost, forgotten, or incorrectly filled. A PowerApps POC failed due to: no external access (Microsoft auth required), signature memory crashes, inability to edit submitted sheets.

**Technical context:** Existing Payload CMS + Vite scaffolding is in place with Users/Posts/Media collections as examples. The stack is proven — we're replacing the example collections with domain-specific ones (Events, Participants, Signatures, AttendanceDays).

**Users:**
- **Organizers** (Ceva employees, ~10-20 users): Log into Payload admin or the Vite frontend to create events, manage participant lists, share QR codes, finalize and export attendance sheets.
- **Participants** (external veterinarians, pharmacists, students, etc.): No account needed. Scan QR code → fill form → sign → done.

**Key workflow:**
1. Organizer creates event with metadata + date range
2. Organizer pre-populates expected participants (from SIMV mock registry)
3. Day of event: organizer opens event, generates QR code
4. Participants scan QR on their phone → form loads → fill info + beneficiary type → draw signature → submit
5. For multi-day events, this repeats each day
6. Organizer finalizes → XLSX generated → auto-emailed + available for download
7. Organizer can reopen to add late participants (existing signatures kept)

## Constraints

- **No IT budget**: Zero licensing costs — open-source stack only (Payload CMS MIT, all libs free)
- **External access**: Participants must use the app without any Ceva account or VPN — public QR code link
- **GDPR compliance**: Collecting personal data (name, email, city, signature, image rights) — must handle with care
- **Target date**: April 20, 2026 — draft proposal for Transparency Committee
- **Deployment**: Docker-based, initially local/dev, then on-premise or Azure — architecture must be portable
- **Performance**: Must handle 800+ events/year, 50+ participants per event, no client-side memory issues with signatures
- **Multi-device**: Must work reliably on smartphones (iOS/Android), tablets, and desktops

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Payload CMS as backend | Config-as-code, auto-generated REST API, built-in admin UI, free MIT license | — Pending |
| Signatures stored as server-side images | PowerApps POC crashed storing signatures in client memory | — Pending |
| Per-day attendance model | Multi-day events need daily signature tracking, not just event-level | — Pending |
| SIMV registry mocked | No API access yet, use seeded mock data for MVP | — Pending |
| Payload built-in email (Nodemailer) | Native email support, Ethereal for dev, real SMTP for production | — Pending |
| Bilingual (FR/EN) | International team, external participants may prefer either language | — Pending |
| No participant accounts | External users scan QR and sign — zero friction, no auth barrier | — Pending |

---
*Last updated: 2026-02-13 after initialization*
