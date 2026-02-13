# Stack Research: c-sign Additional Libraries

**Domain:** Digital attendance sheet / event signing application
**Researched:** 2026-02-13
**Confidence:** HIGH

## Executive Summary

For the c-sign digital attendance sheet application built on Payload CMS 3.x + Vite/React 19, five additional capabilities require specific libraries: signature capture, QR code generation, XLSX export with images, internationalization (FR/EN), and email delivery. Research identified mature, actively maintained libraries for each capability with confirmed React 19 compatibility where applicable.

**Key recommendations:**
- **Signature capture**: react-signature-canvas (wrapper around signature_pad)
- **QR codes**: qrcode.react (SVG rendering, React 19 support confirmed)
- **XLSX export**: exceljs (backend-only, supports image embedding)
- **i18n**: react-i18next + i18next (de facto standard, ecosystem support)
- **Email**: @payloadcms/email-nodemailer (native Payload integration)

All libraries have active maintenance, strong ecosystem support, and clear migration paths if needed. No critical blockers identified.

---

## Recommended Stack

### Signature Capture

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-signature-canvas | ^1.1.0 | Canvas-based signature capture component | Lightweight React wrapper around signature_pad. 100% test coverage, TypeScript support, simple API. Provides `toDataURL()` for image export. 360+ projects use it. Actively maintained (alpha release March 2025). |

**Installation:**
```bash
cd /workspace/frontend
npm install react-signature-canvas
```

**Key APIs:**
- `getTrimmedCanvas()` - removes whitespace for clean signature images
- `toDataURL(type, encoderOptions)` - exports signature as base64 data URL for backend storage
- `clear()` - reset signature pad
- `isEmpty()` - check if signature was drawn

**Why not alternatives:**
- `react-signature-pad` - deprecated, unmaintained
- `react-canvas-draw` - more focused on drawing/sketching, not signature-specific

**Confidence:** HIGH - Official docs verified, React 19 compatibility via modern hooks, widely used

---

### QR Code Generation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| qrcode.react | ^4.2.0 | QR code generation component (SVG/Canvas) | Official React QR component. Explicitly supports React 16.8-19 in peer deps. Dual SVG/Canvas rendering. Well-maintained (v4.2.0 released 2025). Improved SSR compatibility and ESM/CJS dual publishing. |

**Installation:**
```bash
cd /workspace/frontend
npm install qrcode.react
```

**Rendering modes:**
- `QRCodeSVG` - recommended, more flexible, better for styling/scaling
- `QRCodeCanvas` - for cases where Canvas is required

**Props:**
- `value` - data to encode (event URL)
- `size` - dimensions in pixels
- `level` - error correction level (L, M, Q, H)
- `includeMargin` - add quiet zone

**Why not alternatives:**
- `react-qr-code` - 1M+ weekly downloads but less flexible than qrcode.react for dual rendering
- `qr-code-styling` - overkill for standard use cases, adds complexity

**Confidence:** HIGH - Official docs verified, React 19 peer dependency confirmed, active maintenance

---

### XLSX Export with Images

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| exceljs | ^4.4.0 | Excel workbook creation and manipulation (Node.js backend only) | Industry standard for XLSX creation in Node.js. Supports embedding images directly into cells/worksheets. Comprehensive API for formatting, formulas, and images. 2M+ weekly downloads. |

**Installation:**
```bash
cd /workspace/backend
npm install exceljs
```

**Key capabilities:**
- `workbook.addImage()` - register image in workbook (from buffer or file)
- `worksheet.addImage(imageId, range)` - place image in cell or range
- `worksheet.addImage(imageId, { tl, br, ext })` - precise positioning with top-left, bottom-right coordinates
- Full formatting support (fonts, colors, borders, cell merging)
- Streaming API for large files

**Image workflow:**
1. Fetch signature images from Payload (stored as URLs or buffers)
2. Convert to buffer if needed (Axios with `responseType: 'arraybuffer'`)
3. Add to workbook: `const imageId = workbook.addImage({ buffer, extension: 'png' })`
4. Place in worksheet: `worksheet.addImage(imageId, 'B2:C4')`
5. Write file: `workbook.xlsx.writeFile('attendance.xlsx')`

**Why not alternatives:**
- `xlsx` (SheetJS) - cannot embed images (only read/write data)
- `xlsx-populate` - less active, smaller ecosystem
- Cloud services (Google Sheets API) - adds dependency, latency, cost

**Confidence:** HIGH - Official docs verified, image embedding confirmed via GitHub issues/examples

---

### Internationalization (i18n)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-i18next | ^15.x | React bindings for i18next | De facto standard for React i18n. 2.1M+ weekly downloads. React 19 compatible (TypeScript fixes merged). Hook-based (`useTranslation`) and component-based (`<Trans>`) APIs. |
| i18next | ^25.8.x | Core i18n framework | Mature ecosystem with plugins for language detection, backend loaders, formatting. Built-in pluralization, interpolation, and ICU MessageFormat support. |

**Installation:**
```bash
cd /workspace/frontend
npm install react-i18next i18next
```

**Recommended plugins:**
```bash
npm install i18next-browser-languagedetector
# For loading translations from backend (optional)
npm install i18next-http-backend
```

**Configuration pattern:**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: { /* ... */ } },
      fr: { translation: { /* ... */ } }
    },
    fallbackLng: 'fr',
    interpolation: { escapeValue: false }
  });
```

**Usage:**
```typescript
const { t, i18n } = useTranslation();
<button onClick={() => i18n.changeLanguage('en')}>EN</button>
<h1>{t('attendance.title')}</h1>
```

**Why not alternatives:**
- `react-intl` (FormatJS) - component-heavy API, ICU MessageFormat complexity
- `next-intl` - Next.js-specific, not suitable for Vite
- `lingui` - smaller ecosystem, less plugin support

**Confidence:** HIGH - Official docs verified, React 19 support confirmed via GitHub issues

---

### Email Delivery

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @payloadcms/email-nodemailer | Latest (Payload 3.x) | Official Payload email adapter for Nodemailer | Native Payload CMS integration. Zero additional config if using Payload's built-in email system. Supports all Nodemailer transports (SMTP, services like Gmail, SendGrid). Dev mode uses ethereal.email for testing. |

**Installation:**
```bash
cd /workspace/backend
npm install @payloadcms/email-nodemailer
```

**Configuration in `payload.config.ts`:**
```typescript
import { nodemailerAdapter } from '@payloadcms/email-nodemailer';

export default buildConfig({
  email: nodemailerAdapter({
    defaultFromAddress: 'noreply@ceva-attendance.com',
    defaultFromName: 'Ceva Attendance',
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  })
});
```

**Usage (in hooks or endpoints):**
```typescript
await payload.sendEmail({
  to: organizer.email,
  subject: 'Feuille de présence - Event XYZ',
  html: '<p>Veuillez trouver ci-joint...</p>',
  attachments: [{
    filename: 'attendance.xlsx',
    content: excelBuffer
  }]
});
```

**Dev mode:** If `transportOptions` omitted, uses ethereal.email and logs preview URL to console.

**Why not alternatives:**
- Nodemailer directly - reinventing what Payload already provides
- SendGrid SDK - vendor lock-in, Payload adapter handles this via transportOptions
- Resend - newer service, Payload has adapter but Nodemailer more flexible

**Confidence:** HIGH - Official Payload documentation verified, Nodemailer is industry standard

---

## Supporting Libraries

### Optional but Recommended

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| i18next-browser-languagedetector | ^8.x | Auto-detect user language | Automatically set UI language based on browser settings, localStorage, or query param. Reduces friction for multilingual users. |
| axios | ^1.x | HTTP client for image fetching | When exporting XLSX with remote signature images. Use `responseType: 'arraybuffer'` to fetch images as buffers for exceljs. |

**Installation:**
```bash
# Frontend (if needed for API calls)
cd /workspace/frontend
npm install axios

# Backend (for fetching remote images if signatures stored externally)
cd /workspace/backend
npm install axios
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Signature Capture | react-signature-canvas | react-signature-pad | Deprecated, no active maintenance |
| Signature Capture | react-signature-canvas | react-canvas-draw | Drawing-focused, not signature-specific, more complex API |
| QR Code | qrcode.react | react-qr-code | Less flexible (SVG-only until recent versions), no dual rendering |
| QR Code | qrcode.react | qr-code-styling | Over-engineered for standard use case, larger bundle size |
| XLSX | exceljs | xlsx (SheetJS) | Cannot embed images, data-only |
| XLSX | exceljs | xlsx-populate | Less active development, smaller community |
| i18n | react-i18next | react-intl | Component-heavy API, ICU MessageFormat learning curve |
| i18n | react-i18next | lingui | Smaller ecosystem, fewer plugins |
| Email | @payloadcms/email-nodemailer | Nodemailer directly | Payload adapter provides better integration with CMS lifecycle |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| react-signature-pad | Unmaintained since 2018, security vulnerabilities | react-signature-canvas |
| signature_pad directly | Not React-optimized, manual DOM integration needed | react-signature-canvas (React wrapper) |
| xlsx (SheetJS) for image export | Cannot embed images in cells, only read/write data | exceljs |
| Custom canvas signature | Reinvents tested solutions, touch/mouse handling complexity | react-signature-canvas |
| Inline language switching without i18next | Manual translation management, no pluralization, no date/number formatting | react-i18next + i18next |
| SendGrid/Resend SDK directly | Vendor lock-in, Payload adapter already abstracts this | @payloadcms/email-nodemailer with SMTP config |

---

## Installation Summary

### Frontend (`/workspace/frontend`)

```bash
cd /workspace/frontend

# Signature capture
npm install react-signature-canvas

# QR code generation
npm install qrcode.react

# Internationalization
npm install react-i18next i18next i18next-browser-languagedetector

# Optional: HTTP client for image handling
npm install axios
```

### Backend (`/workspace/backend`)

```bash
cd /workspace/backend

# XLSX export with images
npm install exceljs

# Email delivery (Payload adapter)
npm install @payloadcms/email-nodemailer

# Optional: HTTP client for fetching remote images
npm install axios
```

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| react-signature-canvas@^1.1.0 | React 16.8+ (hooks) | Uses modern React APIs (useRef, useEffect). No React 19 blockers identified. |
| qrcode.react@^4.2.0 | React 16.8-19 | Explicitly supports React 19 in peer dependencies. |
| react-i18next@^15.x | React 16.8-19 | React 19 TypeScript issues resolved in recent versions. |
| i18next@^25.x | Framework-agnostic | No React version dependency. |
| exceljs@^4.4.0 | Node.js 14+ | Backend-only, no browser support. |
| @payloadcms/email-nodemailer | Payload CMS 3.x | Designed for Payload 3.x architecture. |

**Note:** All frontend libraries are compatible with Vite 6 and TypeScript strict mode. No known conflicts with existing stack (TanStack Query, React Hook Form, Zod, Tailwind v4, shadcn/ui).

---

## Stack Patterns by Feature

### Signature Capture Workflow

**Frontend:**
1. Render `<SignatureCanvas />` component with ref
2. User draws signature on touch/mouse
3. On submit: `signaturePad.current.getTrimmedCanvas().toDataURL('image/png')`
4. Send base64 string to backend via POST request
5. Backend stores in Payload Media collection or converts to buffer

**Backend:**
1. Receive base64 signature from frontend
2. Store as Payload upload (Media collection) OR
3. Convert to buffer and embed directly in XLSX without storing

### QR Code Workflow

**Frontend (organizer view):**
1. Event created → generate signing URL: `https://app.ceva-attendance.com/sign/{eventId}`
2. Render: `<QRCodeSVG value={signingUrl} size={256} level="H" />`
3. Organizer displays QR code for participants to scan

**Frontend (participant view):**
1. Scan QR code → navigate to signing URL
2. Display event details + signature pad
3. Submit signature

### XLSX Export Workflow

**Backend (Payload hook or endpoint):**
1. Query attendees for event (Payload collection)
2. Create workbook: `const workbook = new ExcelJS.Workbook()`
3. Add worksheet: `const sheet = workbook.addWorksheet('Attendees')`
4. For each attendee:
   - Fetch signature image (from Payload Media or base64)
   - Convert to buffer if needed
   - Add to workbook: `const imgId = workbook.addImage({ buffer, extension: 'png' })`
   - Place in row: `sheet.addImage(imgId, { tl: { col: 5, row: rowIndex }, ext: { width: 100, height: 50 } })`
5. Write buffer: `const buffer = await workbook.xlsx.writeBuffer()`
6. Send via email or return as download

### i18n Workflow

**Setup (frontend `main.tsx`):**
```typescript
import './i18n'; // Initialize i18next before React
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
```

**Usage (components):**
```typescript
const { t, i18n } = useTranslation();
<button onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')}>
  {i18n.language === 'en' ? 'FR' : 'EN'}
</button>
<h1>{t('event.title')}</h1>
```

**Translation files:**
```
frontend/src/locales/
  en/
    translation.json
  fr/
    translation.json
```

### Email Workflow

**Backend (after XLSX generation):**
```typescript
const excelBuffer = await workbook.xlsx.writeBuffer();

await payload.sendEmail({
  to: event.organizer.email,
  subject: t('email.subject', { eventName: event.name }), // Use i18n in backend too
  html: renderEmailTemplate(event, t),
  attachments: [{
    filename: `attendance-${event.slug}.xlsx`,
    content: excelBuffer
  }]
});
```

---

## TypeScript Considerations

All recommended libraries have TypeScript support:

- **react-signature-canvas**: Includes type definitions
- **qrcode.react**: Includes type definitions
- **exceljs**: Includes type definitions
- **react-i18next**: Includes type definitions (some React 19 issues resolved in recent versions)

No `@types/*` packages needed for any recommended library.

---

## Performance Considerations

| Library | Bundle Size Impact | Optimization Strategy |
|---------|-------------------|----------------------|
| react-signature-canvas | ~10KB (+ signature_pad ~20KB) | Lazy load component if signature only on specific routes |
| qrcode.react | ~15KB (SVG), ~25KB (Canvas) | Use SVG mode for smaller bundle. Code-split QR generation to organizer routes only. |
| react-i18next + i18next | ~40KB | Lazy load translations per language. Use namespace splitting for large apps. |
| exceljs | Backend-only | No frontend impact. Use streaming API for large exports (>1000 rows). |

**Recommendation:** Use React Router lazy loading for routes with signatures/QR codes to defer loading these libraries until needed.

```typescript
const SigningPage = lazy(() => import('./pages/SigningPage')); // Loads signature canvas
const OrganizerPage = lazy(() => import('./pages/OrganizerPage')); // Loads QR code
```

---

## Security Considerations

### Signature Capture
- **Canvas fingerprinting**: Signature canvas can leak device info. Mitigate by trimming canvas and only storing final image.
- **XSS via data URLs**: Validate signature data URLs before storage. Use CSP headers.

### QR Codes
- **QR code manipulation**: Sign QR code URLs or use short-lived tokens to prevent tampering.
- **Phishing**: Display event details after scanning to confirm correct event before signing.

### XLSX Export
- **Excel formula injection**: exceljs handles this, but validate any user input used in cells.
- **File size attacks**: Limit number of attendees per export or use streaming.

### Email
- **Email spoofing**: Configure SPF/DKIM records for sending domain.
- **Attachment scanning**: Consider virus scanning for uploaded signature images before including in XLSX.

---

## Sources

### Official Documentation
- [react-signature-canvas GitHub](https://github.com/agilgur5/react-signature-canvas) - Library repository, version info, React compatibility
- [qrcode.react GitHub](https://github.com/zpao/qrcode.react) - React 19 peer dependency verified in package.json
- [exceljs GitHub](https://github.com/exceljs/exceljs) - Image embedding APIs, examples
- [react-i18next Documentation](https://react.i18next.com/) - Official docs, React 19 compatibility
- [Payload CMS Email Documentation](https://payloadcms.com/docs/email/overview) - Nodemailer adapter configuration

### Version Verification
- [npm Compare: QR Libraries](https://npm-compare.com/qr-code-styling,qr.js,qrcode.react,qrious,react-qr-code) - Library comparison, download stats
- [react-signature-canvas npm](https://www.npmjs.com/package/react-signature-canvas) - Current version (1.1.0-alpha.2)
- [qrcode.react Releases](https://github.com/zpao/qrcode.react/releases) - Version 4.2.0 release notes
- [exceljs npm](https://www.npmjs.com/package/exceljs) - Current version (4.4.0)
- [react-i18next Changelog](https://github.com/i18next/react-i18next/blob/master/CHANGELOG.md) - React 19 fixes

### Best Practices & Patterns
- [React Signature Canvas Best Practices 2026](https://www.dhiwise.com/post/how-to-implement-react-signature-canvas-in-your-applications) - Implementation patterns
- [ExcelJS Image Insertion Guide](https://blog.conholdate.com/total/how-to-insert-pictures-in-excel-using-nodejs/) - Image embedding workflow
- [React i18n Complete Guide 2026](https://www.glorywebs.com/blog/internationalization-in-react) - i18next patterns and optimization
- [Payload Nodemailer Integration Blog](https://payloadcms.com/posts/blog/payload-nodemailer-free-and-extensible-email-integration) - Email adapter usage

---

## Confidence Assessment

| Capability | Library | Confidence | Reason |
|------------|---------|------------|--------|
| Signature Capture | react-signature-canvas | HIGH | Official GitHub verified, active maintenance (2025 alpha release), 360+ projects using it, clear API documentation |
| QR Code | qrcode.react | HIGH | React 19 peer dependency explicitly listed in package.json, official releases, dual rendering modes |
| XLSX Export | exceljs | HIGH | Industry standard (2M+ downloads/week), image embedding confirmed via GitHub issues/examples, comprehensive API docs |
| i18n | react-i18next + i18next | HIGH | De facto standard (2.1M+ downloads/week), React 19 issues documented and resolved, official docs comprehensive |
| Email | @payloadcms/email-nodemailer | HIGH | Official Payload adapter, documented in Payload 3.x docs, Nodemailer is industry standard |

**Overall Stack Confidence:** HIGH

All libraries are mature, actively maintained, have large communities, and confirmed compatibility with the existing stack (React 19, Vite 6, TypeScript strict, Payload CMS 3.x).

---

## Open Questions / Future Research

1. **Signature image storage strategy**: Store in Payload Media collection vs. direct base64 in database vs. S3? (Phase-specific decision)
2. **XLSX streaming**: If events exceed 500+ attendees, evaluate exceljs streaming API vs. pagination
3. **Email service selection**: SMTP vs. SendGrid vs. AWS SES for production (infrastructure decision, not library choice)
4. **i18n translation management**: Manual JSON files vs. translation management service (Phrase, Crowdin) for scaling to more languages
5. **QR code styling**: Evaluate qr-code-styling if branding requirements emerge (logo embedding, colors)

These are implementation details that should be decided during phase-specific development, not blockers for library selection.

---

*Stack research for: c-sign digital attendance sheets*
*Researched: 2026-02-13*
*Confidence: HIGH*
