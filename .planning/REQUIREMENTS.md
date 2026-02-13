# Requirements: c-sign

**Defined:** 2026-02-13
**Core Value:** Organizers can collect legally-valid digital signatures from external participants (veterinarians, pharmacists) on any device, without requiring them to log in or install anything.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Event Management

- [ ] **EVNT-01**: Organizer can create an event with name, date range (from/to), expense type, organizer name, and location
- [ ] **EVNT-02**: Organizer can set CNOV declaration number on an event
- [ ] **EVNT-03**: Organizer can select expense type from predefined list (Hospitality-snack, Hospitality-catering, Hospitality-accommodation, Event registration fees, Meeting/organization fees, Transport fees)
- [ ] **EVNT-04**: Event transitions through draft → open → finalized status workflow
- [ ] **EVNT-05**: Organizer can reopen a finalized event to add late participants (existing signatures preserved)
- [ ] **EVNT-06**: System auto-generates one attendance day per day in the event date range
- [ ] **EVNT-07**: Organizer can view event history with past events

### Participant Management

- [ ] **PART-01**: Organizer can pre-populate participant list before the event
- [ ] **PART-02**: Organizer can search participants from mock SIMV registry (by name or registration number)
- [ ] **PART-03**: Organizer can add or remove participants from the pre-populated list
- [ ] **PART-04**: Organizer can add walk-in participants on-site during the event
- [ ] **PART-05**: Participant must select beneficiary type (Veterinarian, Pharmacist, Student, ASV, Technician, Farmer, Other)

### Signature & Check-In

- [ ] **SIGN-01**: Organizer can generate a QR code for each attendance day
- [ ] **SIGN-02**: Participant scans QR code to open signing form on their phone (no login required)
- [ ] **SIGN-03**: Participant fills in: last name, first name, email, city, professional registration number (if applicable), beneficiary type
- [ ] **SIGN-04**: Participant draws handwritten signature on touch-based canvas
- [ ] **SIGN-05**: Signature is uploaded immediately to server as image (not stored in client memory)
- [ ] **SIGN-06**: Participant can check optional right-to-image consent checkbox (YES/NO)
- [ ] **SIGN-07**: Participant sees confirmation after successful submission

### Export & Delivery

- [ ] **EXPO-01**: Organizer can generate XLSX export of finalized attendance sheet with participant data and signature images
- [ ] **EXPO-02**: System auto-emails XLSX to transparence@ceva.com and organizer email upon finalization
- [ ] **EXPO-03**: Organizer can specify their email address as export recipient
- [ ] **EXPO-04**: Organizer can manually download XLSX from the dashboard

### Platform

- [ ] **PLAT-01**: UI is mobile-first responsive (works on smartphones, tablets, desktops)
- [ ] **PLAT-02**: Organizers authenticate via Payload CMS built-in email/password auth
- [ ] **PLAT-03**: UI supports French and English with language toggle
- [ ] **PLAT-04**: Signature images optimized before XLSX embedding (200x100px) to keep file size under email limits

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Reliability

- **RELB-01**: Offline signature capture with IndexedDB queue and auto-sync when online
- **RELB-02**: Multi-device simultaneous check-in with real-time sync

### Compliance

- **COMP-01**: GDPR right-to-erasure with soft-delete and pseudonymization
- **COMP-02**: Data retention policy with auto-delete after legal minimum (5 years)
- **COMP-03**: Audit log of all data access and modifications

### Integration

- **INTG-01**: Real SIMV API integration (replace mock data)
- **INTG-02**: S3-compatible storage adapter for signature images (production scaling)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Complex event scheduling/calendar | Scope creep — c-sign solves attendance, not full event management |
| Badge printing | Hardware dependency, driver issues, support burden |
| Payment processing | Ceva events are free corporate hospitality |
| Analytics/BI dashboard | Export to XLSX, use existing Ceva BI tools |
| Real-time chat/networking | Not core to attendance validation |
| Video/photo uploads | Only signatures as images |
| Mobile native app | PWA-capable web app is sufficient |
| OAuth/SSO/Keycloak | Payload built-in auth sufficient for MVP |
| Facial recognition check-in | Privacy nightmare, GDPR violation risk |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| EVNT-01 | — | Pending |
| EVNT-02 | — | Pending |
| EVNT-03 | — | Pending |
| EVNT-04 | — | Pending |
| EVNT-05 | — | Pending |
| EVNT-06 | — | Pending |
| EVNT-07 | — | Pending |
| PART-01 | — | Pending |
| PART-02 | — | Pending |
| PART-03 | — | Pending |
| PART-04 | — | Pending |
| PART-05 | — | Pending |
| SIGN-01 | — | Pending |
| SIGN-02 | — | Pending |
| SIGN-03 | — | Pending |
| SIGN-04 | — | Pending |
| SIGN-05 | — | Pending |
| SIGN-06 | — | Pending |
| SIGN-07 | — | Pending |
| EXPO-01 | — | Pending |
| EXPO-02 | — | Pending |
| EXPO-03 | — | Pending |
| EXPO-04 | — | Pending |
| PLAT-01 | — | Pending |
| PLAT-02 | — | Pending |
| PLAT-03 | — | Pending |
| PLAT-04 | — | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 0
- Unmapped: 27 ⚠️

---
*Requirements defined: 2026-02-13*
*Last updated: 2026-02-13 after initial definition*
