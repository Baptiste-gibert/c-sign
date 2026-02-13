# Feature Landscape

**Domain:** Digital Attendance Sheet / Event Check-In Application
**Researched:** 2026-02-13
**Confidence:** MEDIUM

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| QR code access for attendees | Industry standard for contactless check-in. 58% of event tickets are mobile, 80% prefer digital over paper | LOW | Generate unique QR per event. Participant scans to access sign-in form. No app download needed (PWA) |
| Digital signature capture | Legal requirement for attendance validation. Must be handwritten, not just checkbox | MEDIUM | Canvas-based touch signature. Store as image. Memory management critical (PowerApps POC failed here) |
| Real-time attendance tracking | Organizers expect live dashboard showing who checked in | LOW | WebSocket or polling. Display check-in count, pending list |
| Excel/XLSX export | Compliance and record-keeping standard. Finance teams expect this format | LOW | Export to XLSX with participant data, signatures (as images or links), timestamps |
| Email delivery of export | Automated distribution to stakeholders after event | LOW | Send XLSX to organizer + configured recipients (e.g., transparence@ceva.com) |
| Pre-event participant list | Organizers prep attendee roster before event to speed check-in | MEDIUM | Upload/search participants, save to event. Display list on check-in day for validation |
| Mobile-first UI | Participants sign on their phones (QR code workflow). 10-50+ people, can't pass one device | HIGH | Responsive design critical. Touch-optimized signature pad. Works iOS/Android/desktop |
| Multi-device simultaneous check-in | Large events need multiple check-in stations or self-service | MEDIUM | Real-time sync across devices. Handle race conditions (same person checking in twice) |
| Offline mode | Venues often have poor connectivity. Check-ins can't fail | HIGH | Store data locally, sync when online. Complex: conflict resolution, data integrity |
| Event history and re-opening | Organizers need to view/edit past events, regenerate reports | MEDIUM | Archive events, allow reactivation. Version control for attendance changes |
| GDPR-compliant consent capture | EU regulation (CEVA is French company). Personal data requires explicit consent | MEDIUM | Consent checkboxes during sign-in. Store consent state. Right to deletion, data export |
| No login required for participants | External attendees (vets, pharmacists) have no corporate account | LOW | Public access via QR. Only organizers authenticate. Critical: failed in PowerApps POC |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| SIMV registry search | Auto-populate veterinarian data from French professional registry. Saves typing, reduces errors | HIGH | Integration with SIMV API (or mock for MVP). Search by name or registration number |
| Per-day attendance for multi-day events | Track who attended which days of multi-day conference/training | MEDIUM | Event date range (from/to). Separate QR or check-in state per day. Export shows attendance by day |
| Right-to-image consent checkbox | GDPR compliance + marketing permission. Separates attendance from photo authorization | LOW | Independent checkbox (not bundled with terms). Clear wording. Store separately from attendance |
| CNOV declaration number field | French veterinary transparency regulation. Ceva must declare expenses to CNOV | LOW | Text field on event. Include in export. Domain-specific compliance |
| Beneficiary type taxonomy | Categorize participants (Vet, Pharmacist, Student, ASV, Technician, Farmer, Other). Enables reporting by audience | LOW | Dropdown on participant form. Required field. Filter exports by type |
| Expense type categorization | Classify event spend (Hospitality-snack/catering/accommodation, Event fees, Transport). Required for compliance reporting | LOW | Event metadata. Dropdown with fixed values. Include in export header |
| On-demand QR code regeneration | Organizer can regenerate/reprint QR if original is lost or damaged | LOW | QR is just URL to event. Always available in organizer dashboard. Print-friendly view |
| Custom organizer email recipient | Each event can specify who receives the export (not just fixed address) | LOW | Email field on event creation. Send to both custom + default address |
| Walk-in participant addition | Add unregistered attendees on-site during event | MEDIUM | Quick-add form accessible during event. Pre-populate minimal info, sign, add to list |
| Bilingual FR/EN interface | Ceva operates internationally. Participants may prefer English | MEDIUM | i18n for UI strings. Language toggle. Store preference. (MVP: French only acceptable) |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Complex event scheduling system | Scope creep. Ceva needs attendance, not full event management suite like Digitevent | Store event date range (from/to), location, name. That's enough. Link to external calendar if needed |
| Participant social features (chat, networking) | Not the core problem. Adds complexity, moderation burden, security risk | Focus on attendance validation. If networking needed, integrate with existing tools (Teams, email) |
| Built-in badge printing | Hardware dependency (printers), driver hell, on-site troubleshooting nightmare | Export participant list to PDF/Excel. Organizer prints badges externally or uses Avery templates |
| Real-time notifications/push alerts | Over-engineering for 800 events/year. Email is sufficient | Send email confirmations, reminders. Organizers check dashboard manually |
| Facial recognition check-in | Privacy nightmare (GDPR violation without explicit consent), expensive, accessibility issues | Stick with QR + signature. Simple, legal, accessible |
| Blockchain/NFT attendance proof | Solution looking for a problem. Adds cost, complexity, environmental concerns | Standard database with audit log. Export to PDF for proof of attendance |
| In-app payment processing | Not needed. Ceva events are company-funded hospitality, not paid ticketing | Attendance is free. Payment is external (corporate finance, not participant) |
| Gamification (leaderboards, points) | Inappropriate for professional compliance context. Attendance is obligation, not game | Professional, straightforward interface. Confirmation message after sign-in |
| Video recording of sign-in | Storage cost, privacy violation, no legal benefit over signature image | Capture signature image only. That's the legal standard |
| Advanced analytics/BI dashboard | Ceva IT has existing BI tools. Don't reinvent | Export clean data (Excel). Let finance/BI team analyze in their tools |

## Feature Dependencies

```
Event Creation
    └──requires──> Event Metadata (name, date, location, type, CNOV number)
                        └──enables──> QR Code Generation
                                          └──enables──> Participant Check-In
                                                            └──requires──> Digital Signature Capture
                                                            └──requires──> Consent Checkboxes (GDPR, right-to-image)
                                                            └──produces──> Attendance Record

Pre-Event Participant List
    └──enables──> SIMV Registry Search (for vets/pharmacists)
    └──enables──> Walk-In Addition (participants not on list)

Participant Check-In
    └──requires──> No Login for Participants (external access)
    └──requires──> Mobile-First UI (they use their phones)
    └──requires──> Offline Mode (venues have bad WiFi)

Multi-Day Events
    └──requires──> Event Date Range (from/to)
    └──requires──> Per-Day Check-In State
    └──conflicts with──> Single QR Code (need QR per day, or date selector)

Export & Delivery
    └──requires──> Completed Attendance Records
    └──requires──> Email Configuration (recipients)
    └──produces──> XLSX File
    └──enables──> Audit Trail / Event History

Event History
    └──requires──> Archived Events
    └──enables──> Reopen for Editing
    └──enables──> Export Regeneration
```

### Dependency Notes

- **Pre-Event Participant List enables SIMV Registry Search**: Only relevant for healthcare professionals. List must support mixed sources (SIMV + manual entry).
- **Participant Check-In requires No Login**: Critical constraint. Failed PowerApps POC because corporate auth blocked external users. Must be public URL with event-specific access control.
- **Multi-Day Events conflicts with Single QR Code**: Either generate per-day QR, or QR leads to date selector screen. Date selector simpler for organizer (one QR to print).
- **Offline Mode requires complex sync**: Check-in must work without internet, then sync when connected. Risk: duplicate entries, data loss. Mitigation: local storage, queue sync, conflict resolution.
- **Digital Signature Capture requires memory management**: PowerApps POC crashed storing 50+ signatures in memory. Upload signature immediately after capture, store server-side, display thumbnail.

## MVP Definition

### Launch With (v1)

Minimum viable product for April 2026 Transparency Committee demo.

- [x] **Event Creation** — Organizer creates event with name, date range, location, expense type, CNOV number
- [x] **QR Code Generation** — Each event gets unique QR. Organizer prints/displays for participants
- [x] **Participant Check-In (no login)** — Scan QR → open form on phone → fill name, email, city, beneficiary type → sign → submit
- [x] **Digital Signature Capture** — Canvas-based touch signature, upload immediately (not stored in memory)
- [x] **GDPR Consent Checkbox** — Participant consents to data processing (required)
- [x] **Right-to-Image Consent** — Separate optional checkbox for photo authorization
- [x] **Real-Time Attendance Dashboard** — Organizer sees who checked in (live updates)
- [x] **Excel Export** — Generate XLSX with participant data, signatures (links or embedded), timestamps
- [x] **Email Delivery** — Send export to organizer + transparence@ceva.com
- [x] **Mobile-First Responsive UI** — Works on iPhone, Android, tablet, desktop
- [x] **Organizer Authentication** — Payload CMS admin login for organizers only

**Rationale**: These 11 features cover the core workflow: create event → share QR → participants sign on phones → organizer exports data. Proves concept, replaces paper, addresses PowerApps POC failures (external access, memory management).

### Add After Validation (v1.x)

Features to add once core is working and gathering user feedback.

- [ ] **Pre-Event Participant List** — Upload/search participants before event. Speeds check-in (name autocomplete)
- [ ] **SIMV Registry Search (mocked)** — Search French veterinary registry by name or registration number. MVP: mock data, not real API
- [ ] **Per-Day Attendance** — Multi-day events track which days each participant attended. Requires date selector or per-day QR
- [ ] **Offline Mode** — Check-ins work without internet, sync later. Complex but critical for remote venues
- [ ] **Event History & Reopen** — View past events, regenerate exports, edit attendance. Required for compliance (corrections, audits)
- [ ] **Walk-In Participant Addition** — Organizer adds unregistered attendees on-site
- [ ] **Beneficiary Type Field** — Classify participants (Vet, Pharmacist, Student, etc.). Required for Ceva reporting
- [ ] **Custom Email Recipient** — Organizer specifies export recipient per event (not just default address)

**Trigger for adding**: User feedback after 5-10 live events. Prioritize based on pain points (e.g., if offline failures are common, bump offline mode to P1).

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Bilingual FR/EN** — French sufficient for MVP (Ceva France). Add English if international BUs adopt
- [ ] **Multi-Device Simultaneous Check-In** — Real-time sync across multiple tablets. Needed for 50+ person events, but rare
- [ ] **On-Demand QR Regeneration** — Print-friendly QR view in dashboard. Nice-to-have, not critical (QR is just URL)
- [ ] **Advanced Participant Search** — Filter by type, date, email domain. Only valuable with large participant history (500+ events)
- [ ] **SIMV Real API Integration** — Replace mock with actual French veterinary registry API. Blocked by: API access approval, credentials, rate limits
- [ ] **Attendance Statistics Dashboard** — Charts: events per month, participants by type, attendance trends. Ceva BI team can build in their tools from Excel exports

**Why defer**:
- FR/EN: Development cost (2x strings, testing). Wait for confirmed international demand.
- Multi-device sync: Complex (race conditions). Most events <30 people, one device sufficient.
- Real SIMV API: External dependency, approval process. Mock proves UX, swap later.
- Statistics: Build vs. buy. Excel exports → existing Ceva BI stack cheaper than custom dashboard.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Notes |
|---------|------------|---------------------|----------|-------|
| QR Code Check-In | HIGH | LOW | P1 | Core workflow. Industry standard |
| Digital Signature | HIGH | MEDIUM | P1 | Legal requirement. Memory management critical |
| No Login (Participants) | HIGH | LOW | P1 | Blocks adoption if missing (POC failure) |
| Mobile-First UI | HIGH | HIGH | P1 | 80% use phones. Not negotiable |
| Real-Time Dashboard | HIGH | LOW | P1 | Organizers need live visibility |
| Excel Export | HIGH | LOW | P1 | Compliance, record-keeping standard |
| Email Delivery | HIGH | LOW | P1 | Automate distribution to stakeholders |
| GDPR Consent | HIGH | MEDIUM | P1 | Legal requirement (EU regulation) |
| Right-to-Image Consent | MEDIUM | LOW | P1 | Marketing use case, simple to add |
| Pre-Event List | HIGH | MEDIUM | P2 | Speeds check-in but not required for v1 |
| SIMV Registry Search | MEDIUM | HIGH | P2 | Nice-to-have. Mock for MVP |
| Per-Day Attendance | MEDIUM | MEDIUM | P2 | Multi-day events are minority (~20/year vs. 800 meals) |
| Offline Mode | HIGH | HIGH | P2 | Critical for reliability but complex. Progressive enhancement |
| Event History | HIGH | MEDIUM | P2 | Auditing, corrections. Add by production |
| Walk-In Addition | MEDIUM | MEDIUM | P2 | Workaround: manual Excel edit post-event |
| Beneficiary Type | MEDIUM | LOW | P2 | Reporting category. Add when data analysis needed |
| Custom Email Recipient | LOW | LOW | P2 | Default address works. Nice-to-have |
| Bilingual FR/EN | LOW | MEDIUM | P3 | French sufficient for France operations |
| Multi-Device Sync | MEDIUM | HIGH | P3 | Only needed for 50+ person events (rare) |
| QR Regeneration | LOW | LOW | P3 | QR is just URL, always accessible |
| Advanced Search | LOW | MEDIUM | P3 | Only valuable with large dataset |
| Real SIMV API | MEDIUM | HIGH | P3 | Mock sufficient for MVP. API requires approval |
| Statistics Dashboard | LOW | HIGH | P3 | Export to Excel → existing BI tools cheaper |

**Priority key:**
- P1: Must have for launch (April 2026 demo)
- P2: Should have, add when possible (post-demo, pre-production)
- P3: Nice to have, future consideration (v2+, based on adoption)

## Competitor Feature Analysis

Based on market research of Digitevent, Digiforma, and event check-in apps.

| Feature | Digitevent | Digiforma | Competitor Pattern | c-sign Approach |
|---------|------------|-----------|-------------------|-----------------|
| QR Code Check-In | Yes (access app, offline) | Yes (smartphone sign-in) | **Table stakes** | Yes, core feature |
| Digital Signature | Yes (electronic signature) | Yes (online sign-in sheet, trainer + learner) | **Table stakes** | Yes, handwritten canvas |
| No Login for Participants | Mixed (depends on event type) | Mixed (email link for learners) | **Varies** | **Yes, critical differentiator** (external vets/pharmacists) |
| Mobile-First | Yes (native app) | Yes (responsive web) | **Table stakes** | Yes, PWA (no app store) |
| Real-Time Tracking | Yes (track arrivals real-time) | Yes (shared in real-time) | **Table stakes** | Yes, live dashboard |
| Excel Export | Yes (download attendee list) | Yes (collective documents) | **Table stakes** | Yes, XLSX format |
| Email Delivery | Yes (automated notifications) | Yes (managing emails feature) | **Common** | Yes, send to organizer + default |
| Pre-Event List | Yes (event registration) | Yes (learner list before training) | **Common** | Yes, v1.x (not MVP) |
| Offline Mode | **Yes (works without internet)** | Limited | **Differentiator** | Yes, v1.x (complex) |
| Multi-Day Events | Yes (event sessions) | Yes (training dates, modules) | **Common** | Yes, v1.x (per-day check-in) |
| Event History | Yes (past events, reports) | Yes (tracked, filed) | **Table stakes** | Yes, v1.x |
| GDPR Compliance | Yes (data protection, consent) | Yes (legal proof, Labour Code) | **Table stakes** | Yes, explicit consent checkboxes |
| Professional Registry Search | No | No | **Not found in competitors** | **Yes, c-sign differentiator** (SIMV registry for French vets) |
| Right-to-Image Consent | No (general consent) | No | **Not found** | **Yes, c-sign differentiator** (separate from attendance consent) |
| CNOV Declaration Field | No | No | **Not found** | **Yes, c-sign differentiator** (French pharma transparency) |
| Beneficiary Type Taxonomy | Partial (attendee types) | Yes (learner categories) | **Common in training** | Yes (Vet, Pharmacist, Student, ASV, etc.) |
| Badge Printing | Yes (on-site printing) | Limited | **Common** | **Anti-feature** (hardware dependency, external print better) |
| Event Scheduling/Calendar | **Yes (full event management)** | **Yes (training calendar, dates)** | **Competitor focus** | **Anti-feature** (scope creep, not core need) |
| Payment Processing | Yes (registration fees) | Yes (paid training) | **Common in ticketing** | **Anti-feature** (Ceva events are free hospitality) |
| Push Notifications | Yes (automated push) | Yes (email notifications) | **Common** | **Anti-feature** (email sufficient for 800/year) |
| Analytics Dashboard | **Yes (data visualization, surveys)** | Yes (eLearning tracking) | **Differentiator** | **Anti-feature** (export to Excel, use existing BI) |

### Key Insights

**Where c-sign matches competitors:**
- QR check-in, digital signature, mobile-first, real-time tracking, Excel export = industry standard
- GDPR compliance, multi-day events, offline mode = expected by 2026

**Where c-sign differentiates:**
- **No login for participants**: Critical for external veterinarians. Competitors assume registered users or email-based auth.
- **SIMV registry integration**: Domain-specific (French veterinary). No competitor has this (general-purpose tools).
- **Separate right-to-image consent**: GDPR best practice. Competitors bundle consent or omit.
- **CNOV declaration number**: French pharmaceutical transparency regulation. Compliance-driven, not found in general tools.

**Where c-sign deliberately differs (anti-features):**
- **No event scheduling suite**: Digitevent/Digiforma are full event management platforms. c-sign solves one problem (attendance) extremely well.
- **No badge printing**: Hardware dependency nightmare. Competitors offer it, but it's a support burden. Better: export to PDF/Excel, print externally.
- **No payment processing**: Competitors target paid ticketing/training. Ceva use case is free corporate hospitality.
- **No built-in analytics**: Competitors sell BI features. c-sign exports clean data to existing Ceva BI stack (cheaper, less maintenance).

**Recommendation**: Build narrow (attendance + compliance), not wide (full event platform). Digitevent/Digiforma licensing costs €5K-15K/year because they solve 50 problems. c-sign solves 5 problems perfectly for Ceva's specific domain (veterinary pharma transparency).

## Sources

### Industry Patterns & Best Practices
- [OneTap Check-In: Simple Attendance Tracking](https://www.onetapcheckin.com/)
- [Top 10 Best Event Check-In Apps for 2026](https://mapdevents.com/blog/10-best-event-check-in-apps-2026)
- [12 Best Event Check-in Apps to Get Attendees In Faster](https://www.vfairs.com/blog/event-check-in/)
- [9 Best Event Attendance Tracking Software Tools (2026 Tested)](https://invitedesk.com/en-gb/blog/event-attendance-tracking-software/)

### QR Code & Digital Signature
- [How to Create a QR Code for Check-In](https://momentivesoftware.com/blog/using-qr-codes-for-event-check-in/)
- [Event Ticket QR Code: The Complete Guide for 2026](https://www.qrcodechimp.com/event-ticket-qr-code-guide/)
- [QR Code Check-In Guide: Simplify Event Management](https://www.skedda.com/insights/qr-code-check-in)

### Competitor Analysis
- [Digitevent: Event Management Platform](https://www.digitevent.com/en)
- [Digitevent Reviews & Pricing 2025](https://www.capterra.com/p/145963/Digitevent/)
- [Digiforma: Electronic Attendance Sheet](https://www.digiforma.com/en/features/electronic-attendance-sheet/)
- [Digiforma: Digital Sign-In via Smartphone](https://www.digiforma.com/en/features/training-sign-in-via-smartphone/)

### GDPR & Compliance
- [Event Data Privacy and Legal Compliance Guide](https://www.eventtia.com/en/event-data-privacy-and-legal-compliance-a-complete-guide/)
- [GDPR Compliance Playbook for Events 2025-2026](https://checkinpax.com/blog/gdpr-compliance-playbook-for-events-a-practical-guide-for-2025-2026/)
- [GDPR Practices in Attendee Data Collection](https://www.fielddrive.com/blog/gdpr-event-data-collection)
- [French Anti-Benefit Regulation for Event Planners](https://native-spaces.com/article/french-anti-benefit-regulation-event-planners)

### Pre-Registration & Participant Management
- [Top 10 Best Event Registration Software for 2026](https://www.eventdex.com/blog/best-event-registration-software-2026/)
- [15 Best Event Registration Platforms & Tools for 2026](https://whova.com/blog/event-registration-software-price-comparison)

### Export & Delivery
- [Attendance Tracker Excel: Easy-to-Use Solutions 2026](https://everhour.com/blog/attendance-tracker-excel/)
- [Free Excel Attendance Tracking Templates](https://www.smartsheet.com/content/excel-attendance-tracking-templates)

### Multi-Day Events & Offline Mode
- [Eventify Event Check-In Solution For 2026](https://eventify.io/event-check-in-software)
- [100% FREE Offline Attendance App](https://www.jibble.io/offline-attendance-app)
- [Check In Attendees Offline at Remote Locations](https://www.eventleaf.com/event-management/event-check-in-app-offline-mode)

### Common Pitfalls
- [12 Event Planning Problems and Solutions 2026](https://www.eventtia.com/en/6-common-event-management-mistakes-and-what-to-do-instead/)
- [Top Employee Attendance Management Mistakes 2026](https://taskfino.com/blog/employee-attendance-management-mistakes)
- [Why Venues Fail: Common Pitfalls 2026](https://www.ticketfairy.com/blog/why-venues-fail-common-pitfalls-and-how-to-avoid-them-in-2026/)

---
**Feature research for:** Digital Attendance Sheet / Event Check-In (Veterinary Pharmaceutical Compliance Context)
**Researched:** 2026-02-13
**Confidence:** MEDIUM (WebSearch verified across multiple sources, domain-specific requirements from project context)
