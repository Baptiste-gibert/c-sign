# Pitfalls Research: Digital Attendance Sheets

**Domain:** Digital Attendance / Event Signing Application
**Researched:** 2026-02-13
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Storing Signatures in Client Memory

**What goes wrong:**
Storing all signatures as base64 data URLs in client-side state or memory causes browser crashes and memory exhaustion, especially on mobile devices with 50+ participants. This was the exact failure mode of the previous PowerApps POC.

**Why it happens:**
Base64-encoded images are 33% larger than binary, and canvas `toDataURL()` is the most obvious API. Developers accumulate signatures in arrays thinking "it's just data" without measuring memory impact. On mobile, signature PNGs at 300x150px average 5-15KB base64 (~3.75-11KB binary), so 50 signatures = 250-750KB in memory, plus browser rendering overhead.

**How to avoid:**
- Immediately upload signatures to backend after capture using multipart form data, not base64 JSON
- Store only the server URL reference in client state
- For offline scenarios, use IndexedDB with Blob storage, not memory arrays
- Use signature_pad's `toData()` (point array) for editing, `toDataURL()` only for final upload
- Test with 100+ signatures on low-end Android devices (2GB RAM)

**Warning signs:**
- Browser "Out of Memory" errors on mobile
- Increasing sluggishness as more signatures are captured
- Browser tab crashes after 20-30 signatures
- DevTools Memory Profiler shows megabytes of data URI strings

**Phase to address:**
Phase 1 (MVP Foundation) - Core signature upload architecture must be correct from the start. This is non-negotiable and cannot be refactored later without rewriting participant submission flow.

**Sources:**
- [OutSystems: Signature Pad Canvas memory usage limit](https://www.outsystems.com/forums/discussion/63399/signature-pad-canvas-memory-usage-limit/)

---

### Pitfall 2: Canvas Touch Events Not Working on iOS Safari

**What goes wrong:**
Signature capture works perfectly on desktop Chrome but fails silently on iOS Safari. Users tap and drag but nothing renders, or signatures get clipped/distorted, or only mouse events fire (which don't exist on touch devices).

**Why it happens:**
iOS Safari requires explicit touch event handling (`touchstart`, `touchmove`, `touchend`) in addition to mouse events. Canvas coordinate calculations fail because `event.touches[0].clientX/Y` needs viewport-to-canvas transformation accounting for scroll, zoom, and devicePixelRatio. The URL bar auto-hide behavior on iOS 15+ causes viewport resize mid-signature, clearing the canvas.

**How to avoid:**
- Use battle-tested libraries (react-signature-canvas wrapping signature_pad) with mobile event handling
- Always handle both touch and mouse events, but prevent double-firing using `event.preventDefault()`
- Lock canvas size on mount, never resize mid-session (prevents iOS URL bar clearing)
- Transform touch coordinates: `canvas.getBoundingClientRect()` + `devicePixelRatio` scaling
- Add `touch-action: none` CSS to prevent scrolling/zooming during signature
- Test on actual iOS devices (Safari quirks don't appear in Chrome DevTools mobile emulation)

**Warning signs:**
- "Works on my Mac but not participant's iPhones"
- Touch events fire outside canvas bounds
- Canvas mysteriously clears mid-signature on iOS
- Signatures appear distorted or offset on Retina displays

**Phase to address:**
Phase 1 (MVP Foundation) - Must be validated before any pilot deployment. iOS Safari is 30-40% of mobile traffic for enterprise events.

**Sources:**
- [GitHub: react-signature-canvas iOS 15 canvas clearing issue](https://github.com/agilgur5/react-signature-canvas/issues/65)
- [Ben Centra: Using Touch Events with HTML5 Canvas](https://bencentra.com/code/2014/12/05/html5-canvas-touch-events.html)
- [Apple Developer: Adding Mouse and Touch Controls to Canvas](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/HTML-canvas-guide/AddingMouseandTouchControlstoCanvas/AddingMouseandTouchControlstoCanvas.html)

---

### Pitfall 3: QR Code Links Without Rate Limiting or Expiration

**What goes wrong:**
Public QR codes for event access get brute-forced (systematic URL traversal to find valid event IDs), reused after events end, or shared on social media enabling unauthorized access. Attackers scan 1000s of sequential IDs (`/sign/event-001`, `/sign/event-002`...) to find active events.

**Why it happens:**
43% of real-world QR login systems lack rate limiting on polling/access endpoints (per Usenix Security 2025 study). Developers use incremental IDs or short random tokens (6 chars = 2 billion combinations, brute-forceable). No expiration checks because "events end eventually."

**How to avoid:**
- Use cryptographically secure random tokens (min 32 chars, UUIDv4 or nanoid)
- Implement endpoint rate limiting: max 10 requests/minute per IP for public signature endpoints
- Add event status checks: block access if `event.status !== 'active'` or `event.endDate < now()`
- Make QR codes single-use or time-limited (JWT with exp claim, validated server-side)
- Log suspicious activity (sequential ID scanning, high failure rates from single IP)
- Never encode sensitive data in QR (emails, names) - only opaque event token

**Warning signs:**
- Sudden spike in 404s for non-existent event IDs
- Access logs show sequential event ID requests from same IP
- Participants report accessing wrong events
- Old events still accessible weeks after completion

**Phase to address:**
Phase 1 (MVP Foundation) - Security is non-negotiable for production. QR links are the primary attack surface since they bypass authentication.

**Sources:**
- [Usenix Security: Demystifying QR Code-based Login Insecurity](https://www.usenix.org/system/files/usenixsecurity25-zhang-xin.pdf)
- [CyberDB: QR Codes and Cybersecurity](https://www.cyberdb.co/qr-codes-and-cybersecurity-reducing-risk-while-improving-secure-access/)
- [Duke Information Security: QR Code Security Guide](https://security.duke.edu/security-guides/qr-code-security-guide/)

---

### Pitfall 4: Embedding Full-Resolution Signature Images in XLSX Exports

**What goes wrong:**
XLSX files with 50+ signatures balloon to 50-150MB, fail email attachment limits (Gmail 25MB, SES 10MB), timeout during generation (60s Lambda limit), and crash Excel on older machines.

**Why it happens:**
Signature canvas defaults to high DPI (devicePixelRatio * canvas size), producing 800x400px PNGs at ~30KB each uncompressed. Developers embed raw canvas `toDataURL()` output into XLSX without optimization. Excel stores images uncompressed internally, and MIME encoding adds 33% to email attachments.

**How to avoid:**
- Resize signatures to 200x100px before embedding (sufficient for printing, 4KB vs 30KB)
- Convert PNG to JPEG at 85% quality for non-transparent backgrounds (3x smaller)
- Use ExcelJS or xlsx-populate with image compression options
- Compress final XLSX (it's ZIP-based, but libs don't always optimize)
- For email: if file > 8MB, generate download link instead of attachment
- Async generation: queue export jobs, send email when ready (don't block HTTP request)
- Test exports with 100+ signatures to validate file size and generation time

**Warning signs:**
- Email bounce: "Message exceeds maximum size"
- Export endpoint timeouts after 30+ seconds
- Lambda/Cloud Function memory exhaustion
- Excel shows "File is too large" or hangs on open

**Phase to address:**
Phase 2 (Export & Email) - Critical before email delivery. Must be validated in load testing with max expected participant count.

**Sources:**
- [Mailtrap: Maximum Email Size Limits](https://mailtrap.io/blog/email-size/)
- [Excel Insider: How to Reduce Excel File Size with Pictures](https://excelinsider.com/excel-pro-tips/reduce-file-size/with-pictures/)
- [GitHub Nodemailer: Large attachments rejected](https://github.com/nodemailer/nodemailer/issues/400)

---

### Pitfall 5: Payload CMS Custom Endpoints Without Authentication

**What goes wrong:**
Public signature submission endpoint bypasses Payload's authentication but doesn't implement its own access control. Attackers POST to `/api/attendance/sign` with any event ID, injecting fake signatures or scraping participant data.

**Why it happens:**
Payload custom endpoints with `root: true` bypass all auth middleware. Documentation emphasizes that "you are responsible for securing your own endpoints." Developers assume public = no security needed, forgetting about abuse prevention (spam, data injection).

**How to avoid:**
- Never use `root: true` for public endpoints (it bypasses req.user population)
- Validate event token in endpoint handler before allowing signature submission
- Use Payload's Local API with access control: `payload.find()` respects collection-level permissions
- Implement secondary validation: check event exists, is active, participant not already signed
- Add CORS restrictions: only allow requests from your frontend domain
- Rate limit per IP: max 5 submissions/minute (participants sign once, attackers hammer endpoints)

**Warning signs:**
- Unexplained duplicate signatures from same participant
- Signatures for non-existent events in database
- Sudden spike in signature submissions outside event hours
- Logs show direct API hits without frontend Referer header

**Phase to address:**
Phase 1 (MVP Foundation) - Must be designed correctly from the start. Post-MVP security retrofitting is extremely risky.

**Sources:**
- [Payload CMS: Access control for custom endpoints](https://github.com/payloadcms/payload/discussions/5007)
- [Payload CMS: Custom endpoints are allow anonymous](https://github.com/payloadcms/payload/issues/8304)
- [Payload CMS Docs: REST API Overview](https://payloadcms.com/docs/rest-api/overview)

---

### Pitfall 6: Multi-Day Events Stored as Duplicated Records

**What goes wrong:**
Three-day conference gets stored as three separate event records (one per day). Updating event details (location, description) requires editing all records. Reporting "total unique participants" double-counts people who attended multiple days. Deleting event leaves orphan day-records.

**Why it happens:**
Naive date-centric modeling: "one event per day" seems natural. Developers duplicate event fields across day-records to avoid joins. PowerApps muscle memory from flat tables without relational design.

**How to avoid:**
- Model as Event (parent) + EventDay (children) or Event + AttendanceRecord (with date field)
- Single Event record stores shared data (title, location, organizer)
- AttendanceRecord links to Event + stores date + participant + signature
- Querying "event attendance" groups by Event ID, not individual days
- Use Payload relationships: `attendanceRecords` field with `hasMany: true` relationship
- Multi-day reporting: `SELECT COUNT(DISTINCT participant_id) WHERE event_id = X`

**Warning signs:**
- Admin UI shows "Workshop Day 1", "Workshop Day 2" as separate events
- Bulk edit requires scripting to update multiple records
- Reports show 150 participants but only 80 unique people attended
- Deleting event requires manual cleanup of related day-records

**Phase to address:**
Phase 1 (MVP Foundation) - Data model is extremely difficult to migrate post-launch. Get it right in Payload collections definition.

**Sources:**
- [Medium: Recurring Calendar Events Database Design](https://medium.com/@aureliadotlim/recurring-calendar-events-database-design-dc872fb4f2b5)
- [Medium: The Complex World of Calendars - Database Design](https://medium.com/tomorrowapp/the-complex-world-of-calendars-database-design-fccb3a71a74b)

---

### Pitfall 7: No GDPR Right to Erasure Implementation Plan

**What goes wrong:**
Participant requests signature deletion (GDPR Article 17 right to erasure). System has no mechanism to remove signature from generated PDFs/XLSX already emailed to organizers. Legal non-compliance risks €20M fine or 4% global revenue.

**Why it happens:**
GDPR seems like "later problem" during MVP. Developers focus on creation, not deletion. Tension between eIDAS (signature must be immutable for legal validity) and GDPR (right to be forgotten). No distinction between "signature on legal document" vs "signature in attendance database."

**How to avoid:**
- Add `deleted_at` soft-delete flag to signature records (never hard delete for audit trail)
- Pseudonymize: replace signature image and participant name with "Redacted per GDPR Article 17"
- Retention policy: auto-delete signatures after legal minimum (France: 5 years for training records)
- Document exceptions: attendance sheets kept for tax/compliance cannot be fully erased
- Build admin UI for erasure requests: search participant, flag for deletion, generate audit log
- Email warning to organizers: "Participant X requested erasure, sheets with their data are invalidated"

**Warning signs:**
- No deletion endpoint in API
- Hard-coded "forever" retention in database
- No audit log of who accessed/deleted what
- Privacy policy promises deletion but system can't deliver

**Phase to address:**
Phase 1 (MVP Foundation) - Must be architecturally supported from day one. Soft-delete and audit logging are foundational patterns.

**Sources:**
- [GDPR-INFO.eu: Article 17 Right to Erasure](https://gdpr-info.eu/art-17-gdpr/)
- [eSignGlobal: Handling GDPR Right to Be Forgotten](https://www.esignglobal.com/blog/handling-gdpr-right-to-be-forgotten-requests)
- [ComplyDog: Right to be Forgotten GDPR Erasure Rights](https://complydog.com/blog/right-to-be-forgotten-gdpr-erasure-rights-guide)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing signatures as base64 JSON instead of file uploads | Simple API, no S3 setup | Memory exhaustion, huge payload sizes, slow API responses | Never - this was the PowerApps failure |
| Using incremental event IDs (`event-1`, `event-2`) | Simple, readable URLs | Enumeration attacks, no security | Never for public endpoints |
| Skipping offline/retry logic for signature submission | Faster MVP delivery | Lost signatures when network drops during event | MVP only, must fix before pilot |
| Local file storage instead of S3 | No cloud vendor setup | Lost files on container restart, no scalability | Dev environment only, never staging/prod |
| Embedding full-res signatures in XLSX | No image processing code | Massive files, email failures | Never - optimize from day one |
| Hard-deleting signatures instead of soft-delete | Simpler code | GDPR non-compliance, no audit trail | Never - soft-delete is table stakes |
| Skipping CORS/rate limiting on public API | Faster initial setup | API abuse, data scraping, DDoS vulnerability | Local dev only, never deployed environments |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Nodemailer SMTP | Attaching 50MB XLSX directly to email | Check file size, use download link if > 8MB, compress images before export |
| Payload CMS Local API | Calling `payload.find()` without `req` context | Always pass `req` to respect access control: `payload.find({ collection: 'events', req })` |
| PostgreSQL file storage | Storing signature blobs in `bytea` columns | Use Payload upload collections with S3 adapter, store URLs in database |
| QR code generation | Encoding event data in QR content | QR contains only opaque token, event data fetched server-side after token validation |
| React signature canvas | Directly using `canvas.toDataURL()` in render | Throttle exports, store result in ref, only generate on save/submit |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all event participants in single API call | Slow page loads, large JSON payloads | Paginate: load 20 participants at a time with infinite scroll | 50+ participants per event |
| Generating XLSX synchronously in HTTP request | Endpoint timeouts, blocked event loop | Queue export job, email link when ready (async background worker) | 100+ signatures or 30s timeout |
| Fetching full signature images for list view | Network waterfalls, slow rendering | Generate 50x25px thumbnails, lazy-load full resolution on click | 20+ signatures visible |
| Base64 encoding signatures in REST responses | Huge JSON payloads, slow parsing | Return image URLs, let browser fetch in parallel with HTTP/2 multiplexing | 10+ signatures in response |
| No database indexes on `event_id`, `participant_email` | Slow queries on attendance records | Add indexes on foreign keys and frequent filter fields | 1,000+ attendance records |
| Single-container deployment without autoscaling | Export jobs block signature submissions | Separate worker containers for exports, API containers for real-time requests | 10+ concurrent events |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| QR code contains participant email/name | Privacy violation, targeted phishing if QR leaked | QR contains only random event token, no PII |
| Public signature endpoint returns other participants' data | Data breach, GDPR violation | Filter by event token + participant ID, validate ownership |
| No validation that participant is registered for event | Signature spam, data pollution | Check `participant_id IN event.registered_participants` before accepting signature |
| Signature images served without authentication | Anyone can scrape all signatures by iterating image IDs | Use signed URLs (S3 presigned) or authentication middleware for image routes |
| Event organizer can edit already-submitted signatures | Audit trail corruption, legal disputes | Signatures immutable after submission, only soft-delete with audit log |
| No HTTPS enforcement on QR links | Man-in-the-middle attacks on mobile networks | Force HTTPS redirect, set HSTS header, check protocol in QR generation |
| Storing PAYLOAD_SECRET in git | Full CMS compromise, data breach | Use environment variables, never commit secrets, rotate immediately if leaked |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Requiring account creation for participants | Friction, 50% drop-off rate | Public signature form accessed via QR, no authentication for participants |
| No "preview signature" before submit | Users unhappy with signature, can't redo | Show signature preview with "Clear" and "Submit" buttons, allow multiple attempts |
| Signature canvas too small on mobile | Unusable on phones, illegible signatures | Responsive canvas: 90vw width on mobile, minimum 300x150px |
| No offline support during signature capture | Lost signatures during network drops at events (common in conference centers) | IndexedDB queue for offline submissions, auto-retry when online |
| Email export only, no in-app view | Organizers can't check attendance during event | Real-time attendance dashboard in admin UI, email as supplementary |
| No confirmation after signature submission | Participants unsure if it worked, re-submit | Success message with visual confirmation (checkmark, "You're signed in!") |
| Desktop-only admin UI | Organizers can't manage events on mobile at venue | Responsive admin with mobile-first design for critical actions |
| No "resend email" button for organizers | Emails lost to spam, organizers can't recover | Admin UI with "Regenerate and resend attendance sheet" button |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Signature capture component:** Often missing touch event handling for iOS Safari - verify on actual iPhone, not just DevTools mobile emulation
- [ ] **QR code access:** Often missing rate limiting and token expiration - verify with security testing (attempt brute force, reuse old QR)
- [ ] **XLSX export:** Often missing image optimization - verify file size with 100+ signatures, check email deliverability
- [ ] **Public API endpoints:** Often missing authentication/authorization checks - verify with direct curl requests bypassing frontend
- [ ] **Multi-day events:** Often missing unique participant counting - verify reports don't double-count across days
- [ ] **Offline signature submission:** Often missing retry logic - verify by disabling network mid-signature, check if it recovers
- [ ] **GDPR deletion:** Often missing soft-delete and audit trail - verify signatures can be pseudonymized without breaking foreign keys
- [ ] **Email attachments:** Often missing size validation - verify behavior when XLSX > 25MB (Gmail limit)
- [ ] **S3 upload configuration:** Often missing CORS, presigned URLs, or environment separation - verify files uploadable from browser, not accessible without auth
- [ ] **Canvas on iOS:** Often missing viewport lock to prevent URL bar clearing - verify signatures don't disappear when scrolling on iOS 15+
- [ ] **Rate limiting:** Often missing on public endpoints - verify max 10 requests/min per IP enforced
- [ ] **Error states:** Often missing user-friendly messages for network failures - verify helpful error shown when API is down

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Signatures stored as base64 in database | MEDIUM | Migrate: decode base64, upload to S3, update records with URLs. Estimate 1-2 days for script + testing. |
| QR codes with sequential IDs already distributed | HIGH | Generate new random tokens, email new QRs to organizers, invalidate old IDs after grace period. Estimate 1 week. |
| XLSX files > 25MB already sent (bounced) | LOW | Regenerate with image optimization, resend via download link instead. Estimate 4 hours. |
| Signatures without GDPR deletion capability | MEDIUM | Add soft-delete flag, pseudonymization script, audit log. Estimate 3-5 days for feature + legal review. |
| Multi-day events duplicated as separate records | HIGH | Data migration: create parent Event records, link AttendanceRecords. Update all queries. Estimate 1-2 weeks. |
| Public API without authentication | MEDIUM | Add event token validation, rate limiting middleware. Deploy hotfix within 24 hours if active exploit. |
| Canvas not working on iOS after launch | HIGH | Integrate react-signature-canvas, retest, redeploy. Estimate 2-3 days if architecture supports swap. |
| No offline support, signatures lost during event | MEDIUM | Add IndexedDB queue, retry logic. Cannot recover lost signatures, only prevent future losses. Estimate 5 days. |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Storing signatures in client memory | Phase 1: MVP Foundation | Load test: capture 100 signatures on mobile, memory stays < 50MB |
| Canvas touch events not working on iOS | Phase 1: MVP Foundation | Manual test: signature capture works on iOS Safari 15+, no clearing/clipping |
| QR codes without rate limiting | Phase 1: MVP Foundation | Penetration test: brute force attempts blocked after 10 requests/min |
| Unoptimized XLSX with huge file sizes | Phase 2: Export & Email | Test export: 100 signatures produces file < 8MB, opens in Excel without lag |
| Custom endpoints without auth | Phase 1: MVP Foundation | Security audit: direct API POST attempts without valid token rejected |
| Multi-day events as duplicated records | Phase 1: MVP Foundation | Data model review: single Event has multiple AttendanceRecords with dates |
| No GDPR deletion mechanism | Phase 1: MVP Foundation | Privacy audit: soft-delete + pseudonymization functional, audit log exists |
| No offline signature support | Phase 3: Mobile & Offline (if prioritized) | Network test: disable WiFi during signature, it queues and sends when reconnected |
| Email attachments exceed size limits | Phase 2: Export & Email | Email test: files > 8MB generate download link instead of attachment |
| Payload file storage on local filesystem | Phase 1: MVP Foundation | Deployment test: container restart doesn't lose uploaded signatures |
| Hard-coded secrets in repository | Phase 1: MVP Foundation | Security scan: no PAYLOAD_SECRET or API keys in git history |

---

## Sources

### Signature Capture & Canvas
- [GitHub: Signature Pad Problem in Mobile](https://github.com/szimek/signature_pad/issues/318)
- [GitHub: Capture outside of drawable canvas with touch events](https://github.com/cerner/terra-core/issues/1191)
- [GitHub: react-signature-canvas iOS 15 canvas clearing](https://github.com/agilgur5/react-signature-canvas/issues/65)
- [OutSystems: Canvas memory usage limit](https://www.outsystems.com/forums/discussion/63399/signature-pad-canvas-memory-usage-limit/)
- [LogRocket: Implementing signature pad with JavaScript](https://blog.logrocket.com/implementing-signature-pad-javascript/)
- [Ben Centra: Using Touch Events with HTML5 Canvas](https://bencentra.com/code/2014/12/05/html5-canvas-touch-events.html)
- [Apple Developer: Adding Touch Controls to Canvas](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/HTML-canvas-guide/AddingMouseandTouchControlstoCanvas/AddingMouseandTouchControlstoCanvas.html)

### QR Code Security
- [Usenix Security: QR Code-based Login Insecurity](https://www.usenix.org/system/files/usenixsecurity25-zhang-xin.pdf)
- [OWASP: Qrljacking Attack](https://owasp.org/www-community/attacks/Qrljacking)
- [CyberDB: QR Codes and Cybersecurity](https://www.cyberdb.co/qr-codes-and-cybersecurity-reducing-risk-while-improving-secure-access/)
- [Duke: QR Code Security Guide](https://security.duke.edu/security-guides/qr-code-security-guide/)
- [Nielsen Norman Group: QR Code Usability Guidelines](https://www.nngroup.com/articles/qr-code-guidelines/)
- [Hoxhunt: QR Code Phishing Explained](https://hoxhunt.com/blog/quishing)

### XLSX Export & Email
- [Mailtrap: Maximum Email Size Limits](https://mailtrap.io/blog/email-size/)
- [Excel Insider: Reduce File Size with Pictures](https://excelinsider.com/excel-pro-tips/reduce-file-size/with-pictures/)
- [GitHub Nodemailer: Large attachments rejected](https://github.com/nodemailer/nodemailer/issues/400)
- [Microsoft Support: Reduce Excel file size](https://support.microsoft.com/en-us/office/reduce-the-file-size-of-your-excel-spreadsheets-c4f69e3a-8eea-4e9d-8ded-0ac301192bf9)
- [Nodemailer: Message attachments documentation](https://nodemailer.com/message/attachments)

### Payload CMS Security
- [Payload CMS: REST API Overview](https://payloadcms.com/docs/rest-api/overview)
- [GitHub: Access control for custom endpoints](https://github.com/payloadcms/payload/discussions/5007)
- [GitHub: Custom endpoints allow anonymous](https://github.com/payloadcms/payload/issues/8304)
- [Payload CMS: Authentication Operations](https://payloadcms.com/docs/authentication/operations)
- [Payload CMS: Storage Adapters](https://payloadcms.com/docs/upload/storage-adapters)

### GDPR & Data Protection
- [GDPR-INFO.eu: Article 17 Right to Erasure](https://gdpr-info.eu/art-17-gdpr/)
- [eSignGlobal: Handling GDPR Right to Be Forgotten](https://www.esignglobal.com/blog/handling-gdpr-right-to-be-forgotten-requests)
- [ComplyDog: GDPR Erasure Rights Guide](https://complydog.com/blog/right-to-be-forgotten-gdpr-erasure-rights-guide)
- [Jetico: Right to Erasure Under GDPR](https://jetico.com/blog/how-right-erasure-applied-under-gdpr-complete-guide-organizational-compliance/)

### Database Design & Multi-Day Events
- [Medium: Recurring Calendar Events Database Design](https://medium.com/@aureliadotlim/recurring-calendar-events-database-design-dc872fb4f2b5)
- [Medium: Complex World of Calendars Database Design](https://medium.com/tomorrowapp/the-complex-world-of-calendars-database-design-fccb3a71a74b)
- [Red Gate: Managing Recurring Events in Data Model](https://www.red-gate.com/blog/again-and-again-managing-recurring-events-in-a-data-model)

### Mobile & Offline Handling
- [Form.io: Offline Mode Documentation](https://help.form.io/developers/offline-mode)
- [Smashing Magazine: Error States for Mobile Apps](https://www.smashingmagazine.com/2016/09/how-to-design-error-states-for-mobile-apps/)
- [LinkedIn: Network Errors and Offline Scenarios](https://www.linkedin.com/advice/1/how-do-you-handle-network-errors-offline)

---

*Pitfalls research for: c-sign Digital Attendance Sheets*
*Researched: 2026-02-13*
*Confidence: HIGH - sourced from official documentation, post-mortems, and peer-reviewed security research*
