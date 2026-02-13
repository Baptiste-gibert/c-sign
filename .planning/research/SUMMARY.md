# Project Research Summary

**Project:** c-sign - Digital Attendance Sheet for Ceva Sante Animale
**Domain:** Event Management / Compliance Tracking
**Researched:** 2026-02-13
**Confidence:** HIGH

## Executive Summary

c-sign is a digital attendance tracking system replacing paper sign-in sheets for Ceva Sante Animale's veterinary pharma events (800 events/year, 5000-10000 participants). The product enables QR-code-based attendance capture with handwritten digital signatures, automatic Excel export, and compliance reporting for French pharmaceutical transparency regulations (CNOV). This domain has well-established patterns in event check-in applications, with clear table stakes (QR access, mobile-first UI, digital signatures, XLSX export, GDPR consent) and known pitfalls from previous POC failures.

The recommended approach is a straightforward headless CMS architecture using Payload CMS 3.x as the backend (auto-generated REST API, built-in authentication for organizers) with a Vite/React SPA frontend. Critical architectural decisions: (1) signature canvas must upload immediately to prevent memory exhaustion (previous PowerApps POC failure), (2) multi-day events modeled as Event parent + AttendanceDay children to avoid data duplication, (3) QR codes link to cryptographically secure random tokens (not sequential IDs) with rate limiting to prevent enumeration attacks, and (4) GDPR right-to-erasure supported via soft-delete from day one.

Key risks and mitigations: (1) iOS Safari signature canvas issues (use battle-tested react-signature-canvas library, test on real devices), (2) XLSX file size bloat causing email failures (optimize signature images to 200x100px before embedding), (3) public signature endpoint abuse (implement rate limiting and event status validation), and (4) GDPR compliance gaps (architect soft-delete and audit logging in Phase 1). The stack is mature and proven (React 19, Payload CMS 3.x, exceljs, react-i18next), with high confidence in all component choices.

## Key Findings

### Recommended Stack

Research identified five capability areas requiring specific libraries beyond the base stack: signature capture, QR code generation, XLSX export with embedded images, internationalization (FR/EN), and email delivery. All recommended libraries are actively maintained with confirmed React 19/Payload CMS 3.x compatibility.

**Core technologies:**
- **react-signature-canvas** (^1.1.0): Canvas-based signature capture — Lightweight React wrapper around signature_pad, 100% test coverage, provides `toDataURL()` for immediate upload, prevents memory exhaustion (PowerApps POC failure)
- **qrcode.react** (^4.2.0): QR code generation (SVG/Canvas) — Explicit React 19 support, dual rendering modes, 15KB bundle size
- **exceljs** (^4.4.0): XLSX export with image embedding — Industry standard (2M+ downloads/week), supports placing PNG signatures in cells, backend-only (no frontend bloat)
- **react-i18next** (^15.x) + i18next (^25.x): Internationalization — De facto standard, 2.1M+ downloads/week, hook-based API, React 19 compatibility confirmed
- **@payloadcms/email-nodemailer**: Email delivery — Native Payload integration, zero additional config, supports SMTP transports, dev mode uses ethereal.email for testing

**Critical version compatibility:** All libraries compatible with React 19, Vite 6, TypeScript strict, and Payload CMS 3.x. No conflicts with existing stack (TanStack Query, React Hook Form, Zod, Tailwind v4, shadcn/ui).

### Expected Features

Event check-in applications have well-defined feature expectations based on industry analysis of Digitevent, Digiforma, and 10+ event management platforms. c-sign differentiates by solving one problem (attendance compliance) extremely well, avoiding feature bloat common in general-purpose platforms.

**Must have (table stakes):**
- QR code access for participants — 58% of event tickets are mobile, industry standard for contactless check-in
- Digital signature capture — Legal requirement for attendance validation, must be handwritten canvas
- Real-time attendance tracking — Organizers expect live dashboard showing who checked in
- Excel/XLSX export — Compliance and record-keeping standard for finance teams
- Email delivery of export — Automated distribution to stakeholders after event
- Mobile-first UI — Participants sign on phones (QR workflow), 10-50+ people per event
- No login required for participants — External veterinarians have no corporate account (PowerApps POC blocker)
- GDPR-compliant consent capture — EU regulation, personal data requires explicit consent

**Should have (differentiators):**
- SIMV registry search — Auto-populate French veterinarian data from professional registry (mock for MVP)
- Per-day attendance for multi-day events — Track who attended which days (20/year vs 800 single-day)
- Right-to-image consent checkbox — Separate from attendance consent for marketing use
- CNOV declaration number field — French veterinary transparency regulation compliance
- Beneficiary type taxonomy — Categorize participants (Vet, Pharmacist, Student, etc.) for reporting
- Walk-in participant addition — Add unregistered attendees on-site during event

**Defer (v2+):**
- Bilingual FR/EN interface — French sufficient for MVP (Ceva France operations)
- Offline mode — Complex (conflict resolution, sync), but valuable for venues with poor connectivity
- Event history and re-opening — View/edit past events, required for compliance corrections
- Multi-device simultaneous check-in — Real-time sync across tablets, only needed for 50+ person events (rare)

**Explicit anti-features:** Complex event scheduling (scope creep), badge printing (hardware dependency), payment processing (events are free), analytics dashboard (export to Excel, use existing BI).

### Architecture Approach

Standard headless CMS architecture with clear separation between public (no auth) and authenticated (organizer) layers. Core pattern: QR codes link to public signature submission form, organizers manage events via Payload admin UI, finalization triggers XLSX generation + email via custom endpoint.

**Major components:**
1. **Public Sign Form** — QR code landing page, signature canvas, no authentication. Vite SPA route with signature canvas library, POST to custom endpoint with overrideAccess for public create.
2. **Event Management** — CRUD for events via Payload admin UI. Hooks auto-generate AttendanceDay records from event date range (one child record per day for multi-day support).
3. **Signature Storage** — Canvas `toDataURL()` → upload to Payload Media collection → create Signature record with relationship to AttendanceDay + Participant + Media. Prevents memory exhaustion by uploading immediately, not storing base64 in client state.
4. **Export & Finalization** — Custom Payload endpoint fetches Event + AttendanceDays + Participants + Signatures + Media, generates XLSX with exceljs, emails via Nodemailer to transparence@ceva.com + organizer.

**Key architectural patterns:**
- **Public Create with Access Control Override**: Custom endpoint with `overrideAccess: true` allows unauthenticated signature submission while keeping collection secured in admin UI
- **Date Range → Child Records Generation**: afterChange hook on Events auto-generates AttendanceDay records (one per day), avoiding multi-day event duplication pitfall
- **Signature Canvas → Upload → Relationship**: Upload signature to Media collection immediately after capture, store only Media ID reference (not base64), enables XLSX embedding and GDPR deletion
- **Event Status State Machine**: Events transition draft → open → finalized with validation rules at each state (prevent editing when finalized, allow reopening for amendments)

### Critical Pitfalls

Research identified seven critical pitfalls from post-mortems, security research, and Payload CMS GitHub issues. Five must be addressed in Phase 1 (architectural), two in Phase 2 (optimization).

1. **Storing Signatures in Client Memory** — Exact PowerApps POC failure. Base64 signatures accumulate in browser memory, causing crashes at 50+ participants on mobile. Mitigation: Upload immediately to backend, store only URL reference in client state. Test with 100+ signatures on 2GB RAM Android device.

2. **Canvas Touch Events Not Working on iOS Safari** — 30-40% of mobile traffic. Signature capture fails silently on iOS due to missing touch event handling, viewport resize clearing canvas. Mitigation: Use react-signature-canvas with battle-tested mobile support, lock canvas size on mount, add `touch-action: none` CSS. Test on actual iPhone, not DevTools emulation.

3. **QR Code Links Without Rate Limiting or Expiration** — 43% of real-world QR login systems lack rate limiting (Usenix Security 2025 study). Attackers brute-force sequential event IDs or reuse old QR codes. Mitigation: Use cryptographically secure random tokens (UUIDv4), implement 10 requests/min rate limit, check event status (active only), log suspicious activity.

4. **Embedding Full-Resolution Signature Images in XLSX Exports** — Signature canvas defaults to high DPI, producing 30KB PNGs. 50 signatures = 50-150MB XLSX, exceeds Gmail 25MB limit, timeouts during generation. Mitigation: Resize to 200x100px before embedding (4KB vs 30KB), convert to JPEG 85% quality, async export job if file > 8MB.

5. **Payload CMS Custom Endpoints Without Authentication** — Custom endpoints with `root: true` bypass all auth. Documentation warns "you are responsible for securing your own endpoints." Mitigation: Never use `root: true` for public endpoints, validate event token in handler, implement rate limiting, use Payload Local API with access control.

6. **Multi-Day Events Stored as Duplicated Records** — Naive modeling: three-day conference = three separate event records. Updating event requires editing all records, reporting double-counts participants. Mitigation: Model as Event (parent) + AttendanceDay (children), single Event record stores shared data, relationships enforce integrity.

7. **No GDPR Right to Erasure Implementation Plan** — GDPR Article 17 requires deletion capability. No mechanism = €20M fine or 4% global revenue. Tension between signature immutability (eIDAS legal validity) and right to be forgotten. Mitigation: Soft-delete flag, pseudonymization ("Redacted per GDPR"), retention policy (5 years auto-delete), audit log, document exceptions for tax compliance.

## Implications for Roadmap

Based on research, recommended phase structure groups foundational architecture (Phase 1), public-facing workflows (Phase 2), organizer features (Phase 3), and compliance/optimization (Phase 4).

### Phase 1: Foundation & Data Model
**Rationale:** Core architecture and data model must be correct from the start. Migration post-launch is extremely costly (PITFALLS.md estimates 1-2 weeks for multi-day event model fix). Stack setup, Payload collections, and access control patterns are foundational.

**Delivers:** Payload CMS configured, PostgreSQL connected, core collections defined (Events, AttendanceDays, Participants, Signatures, Media), authentication for organizers, dev environment validated.

**Addresses:**
- STACK.md: Install and configure all backend dependencies (Payload CMS, Drizzle, exceljs, Nodemailer)
- ARCHITECTURE.md: Implement Event → AttendanceDay parent-child relationship with afterChange hook
- PITFALLS.md: Multi-day events modeled correctly (Pitfall #6), soft-delete architecture for GDPR (Pitfall #7)

**Avoids:** Data model migration debt, incorrect multi-day handling, GDPR non-compliance architecture

**Research flags:** Skip phase-level research (well-documented Payload CMS patterns). Validate with official docs during implementation.

### Phase 2: Signature Capture & Public Access
**Rationale:** Public signature flow is the core product value and highest risk area (PowerApps POC failed here). Must address memory exhaustion, iOS compatibility, and QR security before pilot deployment.

**Delivers:** QR code generation, public sign form (no login), signature canvas with immediate upload, mobile-first responsive UI, rate-limited public endpoint.

**Uses:**
- STACK.md: react-signature-canvas (signature capture), qrcode.react (QR generation)
- ARCHITECTURE.md: Custom endpoint with overrideAccess for public signature submission

**Implements:**
- FEATURES.md: QR code access, digital signature capture, no login for participants, mobile-first UI
- PITFALLS.md: Immediate upload prevents memory exhaustion (Pitfall #1), react-signature-canvas handles iOS Safari (Pitfall #2), cryptographic tokens + rate limiting (Pitfall #3), custom endpoint security (Pitfall #5)

**Avoids:** Browser memory crashes (PowerApps failure), iOS signature failures, QR enumeration attacks, abuse via public API

**Research flags:** Skip research. Stack choices confirmed, patterns documented. Critical: Test on real iOS devices (not DevTools), load test with 100+ signatures on mobile.

### Phase 3: Organizer Dashboard & Event Management
**Rationale:** Organizers need to create events, monitor attendance in real-time, and manage participant lists. Dependencies: signature submission (Phase 2) must work before dashboard is useful.

**Delivers:** Event CRUD via Payload admin UI, real-time attendance dashboard (TanStack Query polling), pre-event participant list upload, walk-in participant addition, beneficiary type taxonomy.

**Addresses:**
- FEATURES.md: Event creation, real-time attendance tracking, pre-event participant list, walk-in addition, beneficiary type field
- ARCHITECTURE.md: Event Management component, Payload admin authentication

**Avoids:** Organizer workflow gaps that delay pilot adoption

**Research flags:** Skip research (standard CRUD + TanStack Query patterns). Consider UX research if pilot feedback identifies friction.

### Phase 4: Export, Email & Compliance
**Rationale:** XLSX export and email delivery enable compliance reporting (primary business value). Image optimization and GDPR deletion are legal requirements before production.

**Delivers:** XLSX export with optimized signature images, email delivery via Nodemailer, GDPR deletion UI and pseudonymization, CNOV declaration number field, right-to-image consent, expense type categorization.

**Uses:**
- STACK.md: exceljs (XLSX generation with image embedding), @payloadcms/email-nodemailer (email delivery)
- ARCHITECTURE.md: Export/Finalization custom endpoint with async job pattern if > 8MB

**Implements:**
- FEATURES.md: Excel export, email delivery, GDPR consent, right-to-image consent, CNOV field
- PITFALLS.md: Resize signatures to 200x100px before embedding (Pitfall #4), soft-delete + pseudonymization (Pitfall #7)

**Avoids:** Email attachment size failures, GDPR legal risk, slow export generation blocking API

**Research flags:** Skip research (exceljs well-documented). Test with 100+ signatures to validate file size < 8MB.

### Phase 5: Internationalization & Enhancement (Optional)
**Rationale:** French-only MVP is sufficient for Ceva France operations (FEATURES.md confirms). Defer i18n until international demand confirmed. Multi-day per-day attendance and SIMV registry search are nice-to-have enhancements.

**Delivers:** Bilingual FR/EN interface, per-day attendance for multi-day events (date selector or per-day QR), SIMV registry search (mocked), custom email recipient per event.

**Uses:**
- STACK.md: react-i18next + i18next (internationalization), axios (SIMV API mocking)
- ARCHITECTURE.md: SIMV Registry as custom endpoint with mock data

**Implements:**
- FEATURES.md: Bilingual FR/EN, per-day attendance, SIMV registry search (differentiators)

**Avoids:** Over-engineering before product-market fit

**Research flags:**
- **SIMV registry search**: If real API integration needed (vs mock), research French SIMV API access approval process, credentials, rate limits
- **Per-day attendance UX**: If user feedback indicates confusion, research date selector patterns in multi-day event apps

### Phase 6: Offline Support & Scaling (Future)
**Rationale:** Offline mode is high user value but high complexity (FEATURES.md: conflict resolution, data integrity). Defer until venue connectivity issues confirmed via pilot feedback. Scaling patterns only needed above 1000 events/year.

**Delivers:** IndexedDB offline signature queue with sync, background job queue for XLSX generation (BullMQ), S3-compatible storage adapter for signatures, multi-device simultaneous check-in with real-time sync.

**Addresses:**
- FEATURES.md: Offline mode, multi-device check-in, event history and re-opening
- ARCHITECTURE.md: Scaling considerations (S3 storage, background jobs, read replicas)
- PITFALLS.md: Offline signature recovery

**Avoids:** Premature optimization before confirming need

**Research flags:**
- **Offline sync patterns**: Research IndexedDB queue strategies, conflict resolution algorithms for concurrent signatures
- **Background job infrastructure**: Research BullMQ setup with Redis, Payload integration patterns

### Phase Ordering Rationale

- **Phase 1 before all others:** Data model migration is 1-2 weeks post-launch (PITFALLS.md). Multi-day event structure, soft-delete architecture, and Payload collections must be correct before any features built on top.
- **Phase 2 before Phase 3:** Organizers can't monitor attendance until signature submission works. Public flow is core product, organizer dashboard is secondary.
- **Phase 4 after Phase 3:** XLSX export requires Event + AttendanceDay + Participant + Signature data populated, which requires Phase 2 (signatures) and Phase 3 (events). Email delivery depends on XLSX generation.
- **Phase 5-6 deferred:** i18n only if international adoption confirmed. Offline mode only if pilot identifies connectivity failures. Both are valuable but not launch-critical (FEATURES.md: v2+ consideration).

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 6 (Offline Support)**: Complex domain with sparse Payload CMS examples. Research IndexedDB queue strategies, conflict resolution patterns for concurrent signatures, BullMQ integration with Payload.
- **Phase 5 (SIMV Real API)**: If mock insufficient, research French veterinary registry API access approval, credentials, authentication, rate limits, response format.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation)**: Well-documented Payload CMS setup, official docs cover all collections/relationships
- **Phase 2 (Signature Capture)**: Stack choices confirmed (react-signature-canvas), patterns documented in ARCHITECTURE.md
- **Phase 3 (Dashboard)**: Standard CRUD + TanStack Query, shadcn/ui components, no novel patterns
- **Phase 4 (Export)**: exceljs well-documented, image optimization is known technique

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries actively maintained, React 19/Payload CMS 3.x compatibility verified via official repos, 2M+ weekly downloads for critical deps (exceljs, i18next) |
| Features | MEDIUM | Table stakes identified via competitor analysis (Digitevent, Digiforma), but domain-specific requirements (SIMV, CNOV) have no external validation beyond project context |
| Architecture | HIGH | Payload CMS patterns verified in official docs, public access control pattern confirmed via GitHub discussions, signature upload workflow matches industry best practices |
| Pitfalls | HIGH | Sourced from post-mortems (PowerApps POC failure), peer-reviewed security research (Usenix 2025 QR study), official Payload GitHub issues, GDPR legal sources |

**Overall confidence:** HIGH

Research is comprehensive with primary sources (official documentation, GitHub repositories, peer-reviewed papers) for all technical decisions. Feature requirements have medium confidence due to reliance on project context (CNOV, SIMV are Ceva-specific) without external industry validation, but core event check-in patterns are well-established.

### Gaps to Address

Gaps identified during research requiring validation during planning or pilot phase:

- **SIMV registry integration strategy**: Mock for MVP confirmed (FEATURES.md), but no research on real French veterinary registry API. If real integration needed, must research API access approval process, credentials, data format, rate limits, cost. Recommend Phase 5 research-phase if moving beyond mock.

- **Offline mode complexity vs. value trade-off**: FEATURES.md identifies offline mode as "complex but critical for remote venues," but no data on actual connectivity failure rate at Ceva events. Pilot phase should monitor network issues to validate if offline support (IndexedDB queue, conflict resolution) is worth 5-day development cost (PITFALLS.md recovery estimate).

- **XLSX file size threshold for download link vs. attachment**: PITFALLS.md recommends 8MB threshold (Gmail 25MB, SES 10MB limits), but no research on typical Ceva event size distribution. If 50-person events are rare, 8MB threshold may be over-engineering. Validate during Phase 4 load testing.

- **Right-to-image consent legal sufficiency**: FEATURES.md identifies separate right-to-image checkbox as differentiator, PITFALLS.md covers GDPR Article 17, but no research on French-specific marketing consent requirements. Legal review recommended before production (not engineering research).

- **Multi-day event prevalence**: FEATURES.md states "20/year vs 800 single-day events" for multi-day conferences. If actual prevalence is higher, per-day attendance (Phase 5) should be promoted to Phase 3. Validate with organizer interviews during pilot.

## Sources

### Primary (HIGH confidence)
- **Payload CMS Official Documentation**: Collections, relationships, access control, uploads, authentication, storage adapters, custom endpoints (payloadcms.com/docs)
- **Library Official Repositories**: react-signature-canvas (GitHub agilgur5), qrcode.react (GitHub zpao), exceljs (GitHub exceljs), react-i18next (GitHub i18next)
- **Security Research**: Usenix Security 2025 - "Demystifying QR Code-based Login Insecurity" (peer-reviewed, 43% lack rate limiting finding)
- **Legal Sources**: GDPR-INFO.eu Article 17 (official EU regulation text), French Anti-Benefit Regulation guides (event planner compliance)

### Secondary (MEDIUM confidence)
- **Competitor Analysis**: Digitevent feature pages, Digiforma training sign-in documentation, Capterra reviews (feature benchmarking, not technical implementation)
- **Industry Patterns**: Event check-in app comparison articles (MapdEvents, vFairs, InviteDesk top 10 lists), QR code security guides (CyberDB, Duke InfoSec)
- **Best Practices**: LogRocket signature pad tutorial, ExcelJS image insertion guides (ConHoldate blog), GloryWebs i18n optimization patterns

### Tertiary (LOW confidence)
- **Post-Mortems**: OutSystems forum discussion on canvas memory limits (PowerApps POC failure context), GitHub issues on signature_pad mobile problems (community-reported, not official)
- **Database Design**: Medium articles on recurring calendar events (individual author expertise, not peer-reviewed)

---
*Research completed: 2026-02-13*
*Ready for roadmap: yes*
