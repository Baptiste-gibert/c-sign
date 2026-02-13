# Phase 04: Export & Email - Research

**Researched:** 2026-02-13
**Domain:** XLSX generation with embedded images, email delivery, image optimization, file downloads
**Confidence:** MEDIUM-HIGH

## Summary

Phase 4 implements the compliance reporting feature that allows organizers to finalize events and receive XLSX files containing participant data and embedded signature images via email. This phase completes the document generation and distribution workflow required for regulatory compliance reporting to CNOV (Conseil National de l'Ordre des Vétérinaires).

Unlike previous phases which focused on user-facing interfaces, Phase 4 is primarily backend-focused server-side processing: generating XLSX files with ExcelJS, optimizing signature images with Sharp (already installed), sending emails via Payload's Nodemailer adapter, and providing file downloads through Next.js App Router route handlers. The frontend work is minimal (finalize button, download button), while the backend implements the complete export pipeline triggered by status transitions.

The critical technical challenge is **file size management**: embedding 50+ signature images (PNG with transparency) can easily produce 20-50MB XLSX files that exceed email attachment limits (typically 8-10MB for most providers). This requires aggressive image optimization (resize to 200x100px, convert to JPEG with quality reduction) before embedding, which Sharp handles efficiently.

**Primary recommendation:** Use ExcelJS 4.x for XLSX generation with `workbook.addImage()` for cell-embedded signatures, Sharp (already installed) for image optimization pipeline (resize 200x100px, convert PNG to JPEG 80% quality), Payload's `@payloadcms/email-nodemailer` adapter for email delivery, Next.js App Router route handler for manual download endpoint, and trigger export via `afterChange` hook on Events collection when status changes to 'finalized'.

**Critical insights:**
- ExcelJS `writeBuffer()` creates XLSX in memory without temp files — critical for containerized deployment
- Sharp can process Buffer-to-Buffer (no file I/O) — perfect for image optimization pipeline
- Email attachment size limits vary by provider (Gmail 25MB, Outlook 20MB, Exchange 10MB default) — target 8MB to be safe
- Base64 encoding overhead adds 33% to file size — 6MB actual file becomes 8MB in email
- Payload email adapter handles SMTP configuration and HTML/attachment composition
- Next.js App Router route handlers use `Response` object with `Content-Disposition` header for downloads
- Status transition from 'open' to 'finalized' is one-way (Phase 1 validation prevents reverse) — perfect trigger point

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ExcelJS | 4.4+ | XLSX file generation with embedded images | Industry standard for Node.js XLSX creation, supports Buffer output, image embedding in cells |
| Sharp | 0.33.5 | Image resizing and format conversion | Already installed, fastest Node.js image processor, Buffer-to-Buffer processing |
| @payloadcms/email-nodemailer | 3.x | Email adapter for Payload CMS | Official Payload email plugin, wraps Nodemailer with Payload's sendEmail API |
| Nodemailer | 6.x | SMTP email transport | Industry standard for Node.js email, dependency of Payload email adapter |
| Next.js App Router | 15.4.11 | Custom API routes for download endpoint | Already installed, native route handlers for file downloads |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | Latest | Date formatting in XLSX cells | Already installed in Phase 3, French locale support |
| Zod | 3.23.8 | Export data validation | Already installed, validate before XLSX generation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ExcelJS | xlsx (SheetJS) | xlsx is faster for simple reads but ExcelJS has better image embedding support and TypeScript types |
| ExcelJS | node-xlsx | node-xlsx is simpler but lacks image embedding and advanced styling features |
| @payloadcms/email-nodemailer | @payloadcms/email-resend | Resend is modern API but requires account/API key, Nodemailer works with any SMTP |
| Sharp | Jimp | Jimp is pure JS (no native deps) but 10x slower, Sharp uses libvips for performance |
| JPEG conversion | Keep PNG | PNG with transparency is 3-5x larger, signatures don't need transparency in XLSX |

**Installation:**

Backend dependencies (new):
```bash
cd /workspace/backend

# XLSX generation
npm install exceljs

# Email adapter
npm install @payloadcms/email-nodemailer nodemailer

# TypeScript types
npm install -D @types/nodemailer
```

Frontend (no new dependencies needed):
- TanStack Query already installed for download API calls
- shadcn/ui Button already installed for finalize/download actions

## Architecture Patterns

### Recommended Project Structure

Backend (`/workspace/backend`):
```
backend/src/
├── collections/
│   ├── Events.ts                 # EXISTING: add finalize button in admin UI
│   ├── Signatures.ts             # EXISTING: no changes
│   └── Media.ts                  # EXISTING: stores signature images
├── hooks/
│   └── events/
│       ├── afterChange.ts        # EXISTING: AttendanceDay creation
│       └── afterFinalize.ts      # NEW: XLSX generation + email on finalize
├── lib/
│   ├── export/
│   │   ├── generateXLSX.ts       # NEW: Main export logic
│   │   ├── optimizeSignature.ts  # NEW: Sharp image optimization
│   │   └── types.ts              # NEW: Export data types
│   └── email/
│       └── templates.ts          # NEW: Email HTML templates
├── app/
│   └── (payload)/
│       └── api/
│           ├── [...slug]/route.ts        # EXISTING: Payload REST API
│           ├── qr-code/route.ts          # EXISTING: Phase 2
│           └── events/
│               └── [id]/
│                   └── export/
│                       └── route.ts      # NEW: Manual download endpoint
└── payload.config.ts             # UPDATE: Add email adapter config
```

Frontend (`/workspace/frontend`):
```
frontend/src/
├── pages/
│   └── EventDetailPage.tsx       # UPDATE: Add finalize + download buttons
├── hooks/
│   ├── use-events.ts             # UPDATE: Add finalize mutation
│   └── use-export.ts             # NEW: Download export hook
└── components/
    └── EventActions.tsx          # NEW: Finalize + download UI
```

### Pattern 1: XLSX Generation with Embedded Signatures

**What:** Generate XLSX file in memory with participant data in rows and signature images embedded in dedicated cells.

**When to use:** When event status changes to 'finalized', triggered by afterChange hook.

**How it works:** Fetch event data with all relationships (participants, sessions, signatures), optimize signature images with Sharp, create workbook with ExcelJS, add images to workbook, place images in cells using anchor coordinates, write to Buffer.

**Example:**

```typescript
// backend/src/lib/export/generateXLSX.ts
// Source: ExcelJS documentation + Sharp documentation
import ExcelJS from 'exceljs'
import { optimizeSignature } from './optimizeSignature'
import type { Payload } from 'payload'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ExportData {
  event: {
    title: string
    location: string
    organizerName: string
    expenseType: string
  }
  attendanceDays: Array<{
    date: string
    sessions: Array<{
      name: string
      signatures: Array<{
        participant: {
          lastName: string
          firstName: string
          email: string
          city: string
          professionalNumber?: string
          beneficiaryType: string
        }
        image: {
          url: string
          filename: string
        }
        rightToImage: boolean
      }>
    }>
  }>
}

export async function generateEventXLSX(
  payload: Payload,
  eventId: string
): Promise<Buffer> {
  // Fetch event with all relationships at depth 3
  const event = await payload.findByID({
    collection: 'events',
    id: eventId,
    depth: 3,
  })

  // Structure data for export
  const exportData = prepareExportData(event)

  // Create workbook
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'c-sign'
  workbook.created = new Date()

  // Add worksheet
  const worksheet = workbook.addWorksheet('Feuille de Présence')

  // Set column widths
  worksheet.columns = [
    { key: 'lastName', width: 20 },
    { key: 'firstName', width: 20 },
    { key: 'email', width: 30 },
    { key: 'city', width: 20 },
    { key: 'professionalNumber', width: 20 },
    { key: 'beneficiaryType', width: 20 },
    { key: 'date', width: 15 },
    { key: 'session', width: 20 },
    { key: 'rightToImage', width: 15 },
    { key: 'signature', width: 30 }, // Signature column
  ]

  // Add header row with event info
  worksheet.addRow([
    'Événement:',
    exportData.event.title,
    '',
    'Lieu:',
    exportData.event.location,
  ])
  worksheet.addRow([
    'Organisateur:',
    exportData.event.organizerName,
    '',
    'Type de dépense:',
    exportData.event.expenseType,
  ])
  worksheet.addRow([]) // Empty row

  // Add column headers
  const headerRow = worksheet.addRow([
    'Nom',
    'Prénom',
    'Email',
    'Ville',
    'N° inscription',
    'Type de bénéficiaire',
    'Date',
    'Session',
    'Droit à l\'image',
    'Signature',
  ])
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }

  let rowNumber = 5 // Start after headers (rows 1-4)

  // Add participant rows with signatures
  for (const day of exportData.attendanceDays) {
    for (const session of day.sessions) {
      for (const sig of session.signatures) {
        const row = worksheet.addRow({
          lastName: sig.participant.lastName,
          firstName: sig.participant.firstName,
          email: sig.participant.email,
          city: sig.participant.city,
          professionalNumber: sig.participant.professionalNumber || '',
          beneficiaryType: sig.participant.beneficiaryType,
          date: format(new Date(day.date), 'P', { locale: fr }),
          session: session.name,
          rightToImage: sig.rightToImage ? 'Oui' : 'Non',
          signature: '', // Placeholder for image
        })

        // Set row height to accommodate signature image
        row.height = 75 // 100px image height in Excel units

        // Optimize and embed signature image
        try {
          // Fetch signature image from Media collection
          const imageBuffer = await fetchImageBuffer(sig.image.url)

          // Optimize: resize to 200x100px, convert to JPEG
          const optimizedBuffer = await optimizeSignature(imageBuffer)

          // Add image to workbook
          const imageId = workbook.addImage({
            buffer: optimizedBuffer,
            extension: 'jpeg',
          })

          // Embed image in signature column (column J = index 9)
          // Use cell range anchor: top-left to bottom-right
          worksheet.addImage(imageId, {
            tl: { col: 9, row: rowNumber - 1 }, // Top-left (0-indexed)
            br: { col: 10, row: rowNumber },    // Bottom-right
            editAs: 'oneCell', // Image moves/sizes with cell
          })
        } catch (error) {
          console.error(`Failed to embed signature for ${sig.participant.email}:`, error)
          // Continue without image
        }

        rowNumber++
      }
    }
  }

  // Auto-filter on header row
  worksheet.autoFilter = {
    from: 'A4',
    to: 'J4',
  }

  // Write to buffer (in-memory, no file I/O)
  const buffer = await workbook.xlsx.writeBuffer()
  return buffer as Buffer
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  // Fetch image from Payload Media URL
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`)
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

function prepareExportData(event: any): ExportData {
  // Transform Payload data into export structure
  // Implementation details omitted for brevity
  return {} as ExportData
}
```

**File size considerations:**
- 50 participants × 200x100px JPEG at 80% quality ≈ 5-8KB each = 250-400KB total images
- XLSX structure overhead ≈ 50-100KB
- Total file size ≈ 300-500KB (well under 8MB limit)

### Pattern 2: Image Optimization Pipeline (Sharp)

**What:** Resize signature images to 200×100px and convert PNG to JPEG to minimize file size.

**When to use:** Before embedding signatures in XLSX during export generation.

**How it works:** Sharp processes Buffer input, resizes with aspect ratio preservation, converts to JPEG with quality setting, outputs to Buffer.

**Example:**

```typescript
// backend/src/lib/export/optimizeSignature.ts
// Source: https://sharp.pixelplumbing.com/api-resize
import sharp from 'sharp'

/**
 * Optimize signature image for XLSX embedding
 *
 * Input: Original signature PNG (typically 300x150px with transparency)
 * Output: 200x100px JPEG at 80% quality (~5-8KB per signature)
 *
 * Why: PNG with alpha channel is 3-5x larger than JPEG for signatures.
 * Signatures don't need transparency in XLSX (white background is fine).
 */
export async function optimizeSignature(
  inputBuffer: Buffer
): Promise<Buffer> {
  try {
    const optimized = await sharp(inputBuffer)
      .resize(200, 100, {
        fit: 'inside',              // Preserve aspect ratio, don't crop
        withoutEnlargement: true,   // Don't upscale if image is smaller
        background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // Remove alpha channel
      .jpeg({
        quality: 80,                // Good balance of size vs quality
        progressive: false,         // Not needed for small images
        mozjpeg: true,              // Use mozjpeg compression (better quality)
      })
      .toBuffer()

    return optimized
  } catch (error) {
    console.error('Image optimization failed:', error)
    throw new Error('Failed to optimize signature image')
  }
}
```

**Performance notes:**
- Sharp processes 50 images in ~200-500ms (libvips is extremely fast)
- Buffer-to-Buffer processing avoids file I/O overhead
- `fit: 'inside'` preserves aspect ratio while respecting max dimensions
- `mozjpeg: true` uses better compression algorithm than standard libjpeg
- Quality 80 is sweet spot: visually identical to 100 but 40-50% smaller

### Pattern 3: Email Delivery via Payload Adapter

**What:** Configure Payload email adapter with Nodemailer SMTP transport, send emails with XLSX attachments.

**When to use:** After successful XLSX generation, send to transparence@ceva.com and organizer email.

**How it works:** Configure Nodemailer adapter in Payload config, use `req.payload.sendEmail()` API with attachment Buffer.

**Example:**

```typescript
// backend/src/payload.config.ts
// Source: https://payloadcms.com/docs/email/overview
import { buildConfig } from 'payload'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
// ... other imports

export default buildConfig({
  // ... other config
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM_EMAIL || 'noreply@ceva.com',
    defaultFromName: 'c-sign - Ceva Santé Animale',
    transportOptions: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  }),
})
```

```typescript
// backend/src/hooks/events/afterFinalize.ts
// Source: https://payloadcms.com/docs/email/overview + https://nodemailer.com/message/attachments
import type { CollectionAfterChangeHook } from 'payload'
import { generateEventXLSX } from '@/lib/export/generateXLSX'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const afterFinalize: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Only trigger on status change to 'finalized'
  if (
    operation === 'update' &&
    doc.status === 'finalized' &&
    previousDoc?.status !== 'finalized'
  ) {
    try {
      // Generate XLSX export
      const xlsxBuffer = await generateEventXLSX(req.payload, doc.id)

      // Prepare email recipients
      const recipients = [
        'transparence@ceva.com',
        doc.organizerEmail, // From event.organizerEmail field
      ]

      const filename = `feuille-presence-${doc.title.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`

      // Send email with attachment
      await req.payload.sendEmail({
        to: recipients.join(', '),
        subject: `Feuille de présence - ${doc.title}`,
        html: `
          <h2>Événement finalisé</h2>
          <p>Bonjour,</p>
          <p>L'événement <strong>${doc.title}</strong> a été finalisé.</p>
          <p>Vous trouverez en pièce jointe la feuille de présence avec les signatures des participants.</p>
          <ul>
            <li><strong>Organisateur :</strong> ${doc.organizerName}</li>
            <li><strong>Lieu :</strong> ${doc.location}</li>
            <li><strong>Type de dépense :</strong> ${doc.expenseType}</li>
          </ul>
          <p>Cordialement,<br>c-sign - Ceva Santé Animale</p>
        `,
        attachments: [
          {
            filename,
            content: xlsxBuffer,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        ],
      })

      req.payload.logger.info(`Export email sent for event ${doc.id} to ${recipients.join(', ')}`)
    } catch (error) {
      req.payload.logger.error(`Failed to send export email for event ${doc.id}:`, error)
      // Don't throw — we don't want to block the status transition
      // Organizer can still manually download
    }
  }

  return doc
}
```

**Email size limits reference:**
- Gmail: 25MB (sends as Google Drive link if exceeded)
- Outlook.com: 20MB
- Exchange: 10MB default (admin configurable up to 150MB)
- Base64 encoding overhead: +33%
- Target: 6MB actual file → ~8MB encoded → safe for all providers

### Pattern 4: Manual Download Endpoint (Next.js App Router)

**What:** Custom API route that generates and streams XLSX file with proper download headers.

**When to use:** Organizer clicks "Download" button on event detail page to manually retrieve export.

**How it works:** Next.js route handler generates XLSX, returns Response with Content-Disposition header triggering browser download.

**Example:**

```typescript
// backend/src/app/(payload)/api/events/[id]/export/route.ts
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/route
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { generateEventXLSX } from '@/lib/export/generateXLSX'
import { format } from 'date-fns'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await getPayload({ config })

    // Verify user is authenticated
    const user = await payload.auth({ headers: req.headers })
    if (!user?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch event (organizerScoped access control applies automatically)
    const event = await payload.findByID({
      collection: 'events',
      id: params.id,
      user: user.user,
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Only allow export for finalized events
    if (event.status !== 'finalized') {
      return NextResponse.json(
        { error: 'Event must be finalized before export' },
        { status: 400 }
      )
    }

    // Generate XLSX
    const xlsxBuffer = await generateEventXLSX(payload, params.id)

    // Prepare filename
    const filename = `feuille-presence-${event.title.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`

    // Return file with download headers
    return new Response(xlsxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': xlsxBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Export download failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    )
  }
}
```

**Frontend usage:**

```typescript
// frontend/src/hooks/use-export.ts
import { useMutation } from '@tanstack/react-query'

export function useDownloadExport() {
  return useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(`/api/events/${eventId}/export`, {
        credentials: 'include', // Send auth cookies
      })

      if (!res.ok) {
        throw new Error('Failed to download export')
      }

      // Get filename from Content-Disposition header
      const contentDisposition = res.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch?.[1] || 'export.xlsx'

      // Create blob and trigger download
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
  })
}
```

```typescript
// frontend/src/pages/EventDetailPage.tsx
import { useDownloadExport } from '@/hooks/use-export'
import { Button } from '@/components/ui/button'

export function EventDetailPage() {
  const { eventId } = useParams()
  const { data: event } = useEvent(eventId)
  const downloadMutation = useDownloadExport()

  const handleDownload = () => {
    downloadMutation.mutate(eventId)
  }

  return (
    <div>
      {/* ... event details ... */}

      {event?.status === 'finalized' && (
        <Button
          onClick={handleDownload}
          disabled={downloadMutation.isPending}
        >
          {downloadMutation.isPending ? 'Téléchargement...' : 'Télécharger XLSX'}
        </Button>
      )}
    </div>
  )
}
```

### Pattern 5: Event Status Transition Hook

**What:** Use Events collection's existing afterChange hook to trigger export when status changes to 'finalized'.

**When to use:** Integrate with Phase 1's status transition validation.

**How it works:** Add afterFinalize logic to existing afterChange hook array, check for status transition, generate and email export.

**Example:**

```typescript
// backend/src/collections/Events.ts (UPDATE)
import { afterEventChange } from '@/hooks/events/afterChange'
import { afterFinalize } from '@/hooks/events/afterFinalize'

export const Events: CollectionConfig = {
  // ... existing config
  hooks: {
    beforeChange: [
      // EXISTING: Status transition validation
      async ({ data, req, operation, originalDoc }) => {
        if (operation === 'update' && data.status && originalDoc?.status && data.status !== originalDoc.status) {
          const oldStatus = originalDoc.status
          const newStatus = data.status

          if (oldStatus === 'open' && newStatus === 'draft') {
            throw new Error('Un événement ouvert ne peut pas revenir en brouillon')
          }
          if (oldStatus === 'finalized' && (newStatus === 'draft' || newStatus === 'open')) {
            throw new Error('Un événement finalisé ne peut pas être modifié')
          }
        }
        return data
      },
      // EXISTING: Set createdBy
      ({ data, req, operation }) => {
        if (operation === 'create' && !data.createdBy && req.user) {
          data.createdBy = req.user.id
        }
        return data
      },
    ],
    afterChange: [
      afterEventChange,  // EXISTING: AttendanceDay creation
      afterFinalize,     // NEW: XLSX export + email on finalize
    ],
  },
}
```

**Hook execution flow:**
1. Organizer clicks "Finalize" button in admin UI or frontend
2. `PATCH /api/events/{id}` with `{ status: 'finalized' }`
3. `beforeChange` validates transition (open → finalized is allowed)
4. Event status updates in database
5. `afterChange` hooks run in order:
   - `afterEventChange` — no-op (AttendanceDays already exist)
   - `afterFinalize` — generates XLSX, sends email
6. Response returns to frontend
7. User receives email within seconds

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| XLSX file generation | Custom XML writer, template files | ExcelJS | XLSX is complex zip archive with XML parts, ExcelJS handles relationships/styles/images correctly |
| Image resizing | Canvas API, custom pixel manipulation | Sharp | Canvas is 10x slower, Sharp uses libvips (C library) for blazing performance |
| Email sending | Raw SMTP socket, manual MIME encoding | Nodemailer + Payload adapter | SMTP protocol is complex, MIME multipart encoding is error-prone, Nodemailer is battle-tested |
| File downloads | Manual blob construction, custom headers | Next.js Response with Content-Disposition | Browsers handle Content-Disposition differently, Next.js abstracts edge cases |
| Image optimization pipeline | Multiple libraries (resize, convert, compress) | Sharp single pipeline | Sharp chains operations efficiently in single pass, fewer dependencies |
| XLSX streaming for large files | Manual stream handling | ExcelJS streaming writer | Memory management for 1000+ rows requires careful stream coordination |
| Email HTML templates | String concatenation | Template library or simple function | HTML escaping, responsive tables, Outlook quirks — use tested patterns |

**Key insight:** XLSX generation and email delivery are both deceptively complex. Excel's `.xlsx` format is a zip archive containing 10+ XML files with strict relationships and namespaces. Email's MIME multipart format requires precise header encoding and boundary markers. Both have edge cases that take years to discover (Excel date formats, Outlook CSS support, attachment encoding). Use proven libraries.

## Common Pitfalls

### Pitfall 1: ExcelJS Image Anchor Coordinates (0-indexed vs 1-indexed)

**What goes wrong:** Images appear in wrong cells or offset by one row/column from expected position.

**Why it happens:** ExcelJS image anchors use 0-indexed coordinates (`{ col: 0, row: 0 }` = cell A1), but worksheet row numbers are 1-indexed (`worksheet.addRow()` returns row 1, 2, 3...).

**How to avoid:** When placing images, convert row numbers to 0-indexed coordinates.

```typescript
// WRONG: Using 1-indexed row number directly
const row = worksheet.addRow(data) // Returns row object with row.number = 5
worksheet.addImage(imageId, {
  tl: { col: 9, row: 5 },  // Image appears in row 6 (off by one!)
})

// CORRECT: Convert to 0-indexed
const row = worksheet.addRow(data)
worksheet.addImage(imageId, {
  tl: { col: 9, row: row.number - 1 },  // row.number is 1-indexed, subtract 1
  br: { col: 10, row: row.number },
})
```

**Warning signs:** Signature images appear one row below participant data, images overlap wrong cells, first image is in row 2 instead of row 1.

**Source:** [ExcelJS GitHub Issues #1029](https://github.com/exceljs/exceljs/issues/1029)

### Pitfall 2: Email Attachment Size Limits (Base64 Overhead)

**What goes wrong:** 9MB XLSX file successfully generates but email bounces with "attachment too large" error despite being under 10MB limit.

**Why it happens:** Email attachments are Base64 encoded, which adds 33% overhead. A 9MB file becomes 12MB in the email, exceeding limits.

**How to avoid:** Target 6MB actual file size maximum (becomes ~8MB encoded). Monitor file size after generation, warn if approaching limit.

```typescript
// CORRECT: Check file size and warn
const xlsxBuffer = await workbook.xlsx.writeBuffer()
const fileSizeMB = xlsxBuffer.length / (1024 * 1024)

if (fileSizeMB > 6) {
  req.payload.logger.warn(
    `XLSX file size is ${fileSizeMB.toFixed(2)}MB. ` +
    `After Base64 encoding, email will be ~${(fileSizeMB * 1.33).toFixed(2)}MB. ` +
    `May exceed email provider limits.`
  )
}

// Consider additional optimization for large files
if (fileSizeMB > 8) {
  throw new Error(
    'XLSX file too large for email delivery. ' +
    'Consider reducing image quality or splitting into multiple files.'
  )
}
```

**Warning signs:** Emails don't arrive for large events, SMTP server returns "552 Message size exceeds fixed maximum" error, Gmail auto-converts to Drive link.

**Source:** [Mailtrap Email Size Limits Guide](https://mailtrap.io/blog/email-size/)

### Pitfall 3: Sharp Image Processing Without Error Handling

**What goes wrong:** Single corrupted signature image causes entire export to fail with cryptic error "Input buffer contains unsupported image format".

**Why it happens:** Sharp throws errors for invalid images, truncated files, unsupported formats. If one signature is corrupted, entire export pipeline halts.

**How to avoid:** Wrap Sharp operations in try-catch, log errors, continue export with placeholder or skip signature.

```typescript
// WRONG: Unhandled Sharp error blocks entire export
for (const sig of signatures) {
  const optimized = await sharp(sig.imageBuffer).resize(200, 100).jpeg().toBuffer()
  // If sig.imageBuffer is corrupted, entire export fails
}

// CORRECT: Graceful degradation
for (const sig of signatures) {
  try {
    const optimized = await sharp(sig.imageBuffer)
      .resize(200, 100)
      .jpeg({ quality: 80 })
      .toBuffer()

    const imageId = workbook.addImage({ buffer: optimized, extension: 'jpeg' })
    worksheet.addImage(imageId, ...)
  } catch (error) {
    req.payload.logger.error(
      `Failed to optimize signature for ${sig.participant.email}:`,
      error
    )
    // Continue without this signature (or use placeholder)
    // Don't fail entire export
  }
}
```

**Warning signs:** Export succeeds for some events but fails for others with same participant count, "Input buffer contains unsupported image format" error, exports fail after specific participant signs.

**Source:** [Sharp GitHub Issues](https://github.com/lovell/sharp)

### Pitfall 4: Payload Local API Context (req.payload vs await getPayload)

**What goes wrong:** In route handlers, calling `payload.findByID()` without user context bypasses access control, allowing any authenticated user to download any event's export.

**Why it happens:** Payload's Local API has two contexts: (1) hooks receive `req.payload` with user context attached, (2) route handlers must manually call `payload.auth()` to attach user context.

**How to avoid:** In route handlers, always call `payload.auth()` before using Local API, or use REST API endpoints which handle auth automatically.

```typescript
// WRONG: No user context, bypasses organizerScoped access control
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await getPayload({ config })
  const event = await payload.findByID({
    collection: 'events',
    id: params.id,
    // Missing user context — any authenticated user can access any event!
  })
}

// CORRECT: Attach user context from request headers
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const payload = await getPayload({ config })

  // Authenticate request
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Pass user context to Local API
  const event = await payload.findByID({
    collection: 'events',
    id: params.id,
    user, // organizerScoped access control now applies
  })
}
```

**Warning signs:** Organizer A can download exports for organizer B's events, access control works in admin UI but not in API routes, 403 errors in admin but success in custom endpoints.

**Source:** [Payload CMS Local API Documentation](https://payloadcms.com/docs/local-api/overview)

### Pitfall 5: Nodemailer SMTP Connection Pooling

**What goes wrong:** First email sends successfully but subsequent emails hang or timeout, especially under load.

**Why it happens:** Nodemailer creates SMTP connection pool by default. If pool exhausts (5 connections default), new emails wait indefinitely.

**How to avoid:** Configure pool size or disable pooling for low-volume use cases. For production, use dedicated SMTP service (SendGrid, AWS SES) instead of shared SMTP server.

```typescript
// Development: Disable pooling (simpler, acceptable for low volume)
email: nodemailerAdapter({
  defaultFromAddress: 'noreply@ceva.com',
  defaultFromName: 'c-sign',
  transportOptions: {
    host: process.env.SMTP_HOST,
    port: 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    pool: false, // Disable connection pooling
  },
})

// Production: Configure pool for concurrent sends
email: nodemailerAdapter({
  defaultFromAddress: 'noreply@ceva.com',
  defaultFromName: 'c-sign',
  transportOptions: {
    host: process.env.SMTP_HOST,
    port: 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    pool: true,
    maxConnections: 5,      // Max concurrent SMTP connections
    maxMessages: 100,       // Max emails per connection before reconnect
    rateDelta: 1000,        // Time window for rateLimit
    rateLimit: 10,          // Max emails per rateDelta
  },
})
```

**Warning signs:** First event finalization sends email but second hangs, emails queue up and send in bursts after delays, "Connection timeout" errors after multiple events finalized.

**Source:** [Nodemailer SMTP Transport Documentation](https://nodemailer.com/smtp/)

### Pitfall 6: ExcelJS writeBuffer Memory Consumption

**What goes wrong:** Large exports (100+ participants) cause Node.js heap out-of-memory errors during `writeBuffer()`.

**Why it happens:** `writeBuffer()` builds entire XLSX in memory before returning. For large files with many images, this can exceed Node.js default heap size (512MB-1GB).

**How to avoid:** For small exports (<100 participants), `writeBuffer()` is fine. For large exports, use streaming writer or increase Node.js heap size.

```typescript
// For small exports: Simple writeBuffer (current approach)
const buffer = await workbook.xlsx.writeBuffer()

// For large exports: Stream to temporary buffer
import { Writable } from 'stream'

class BufferWritable extends Writable {
  private chunks: Buffer[] = []

  _write(chunk: Buffer, encoding: string, callback: Function) {
    this.chunks.push(chunk)
    callback()
  }

  toBuffer(): Buffer {
    return Buffer.concat(this.chunks)
  }
}

const stream = new BufferWritable()
await workbook.xlsx.write(stream)
const buffer = stream.toBuffer()

// Or increase Node.js heap size in production
// package.json scripts:
// "start": "NODE_OPTIONS='--max-old-space-size=2048' next start"
```

**Warning signs:** Small events export successfully but large events crash with "JavaScript heap out of memory", exports fail after ~50-70 participants, memory usage spikes during export.

**Source:** [ExcelJS GitHub Issues #2953](https://github.com/exceljs/exceljs/issues/2953)

### Pitfall 7: Date-fns Locale Not Applied in XLSX

**What goes wrong:** Dates in XLSX appear in English format ("01/15/2026") instead of French ("15/01/2026") despite using date-fns with French locale.

**Why it happens:** Excel cells have their own number format independent of JavaScript date formatting. Setting cell value as formatted string loses Excel's date features (sorting, filtering).

**How to avoid:** Set cell value as JavaScript Date object, then apply Excel's French date format code.

```typescript
// WRONG: Format date as string (loses Excel date features)
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

row.getCell('date').value = format(new Date(day.date), 'P', { locale: fr })
// Becomes string "15/01/2026", not recognized as date by Excel

// CORRECT: Use native Date + Excel format code
row.getCell('date').value = new Date(day.date)
row.getCell('date').numFmt = 'dd/mm/yyyy' // Excel's French date format

// Or use Excel's built-in French short date format
row.getCell('date').numFmt = 'dd/mm/yy'
```

**Warning signs:** Dates can't be sorted/filtered in Excel, dates appear as text with green error indicator, date format changes when file opened in different locale.

**Source:** [ExcelJS Number Formats Documentation](https://github.com/exceljs/exceljs#number-formats)

## Code Examples

Verified patterns from official sources.

### Complete Export Pipeline (Hook Integration)

```typescript
// backend/src/hooks/events/afterFinalize.ts
import type { CollectionAfterChangeHook } from 'payload'
import { generateEventXLSX } from '@/lib/export/generateXLSX'
import { format } from 'date-fns'

export const afterFinalize: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Only trigger on status transition to 'finalized'
  if (
    operation === 'update' &&
    doc.status === 'finalized' &&
    previousDoc?.status !== 'finalized'
  ) {
    // Don't await — run async to avoid blocking response
    generateAndEmailExport(req, doc).catch((error) => {
      req.payload.logger.error(`Background export failed for event ${doc.id}:`, error)
    })
  }

  return doc
}

async function generateAndEmailExport(req: any, event: any) {
  try {
    const xlsxBuffer = await generateEventXLSX(req.payload, event.id)

    const fileSizeMB = xlsxBuffer.length / (1024 * 1024)
    req.payload.logger.info(`Generated XLSX: ${fileSizeMB.toFixed(2)}MB`)

    const filename = `feuille-presence-${event.title.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`

    await req.payload.sendEmail({
      to: ['transparence@ceva.com', event.organizerEmail].join(', '),
      subject: `Feuille de présence - ${event.title}`,
      html: buildEmailTemplate(event),
      attachments: [
        {
          filename,
          content: xlsxBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    })

    req.payload.logger.info(`Export email sent for event ${event.id}`)
  } catch (error) {
    req.payload.logger.error(`Export failed for event ${event.id}:`, error)
    throw error
  }
}

function buildEmailTemplate(event: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        h2 { color: #2563eb; }
        ul { list-style: none; padding: 0; }
        li { padding: 4px 0; }
        strong { color: #1f2937; }
      </style>
    </head>
    <body>
      <h2>Événement finalisé</h2>
      <p>Bonjour,</p>
      <p>L'événement <strong>${event.title}</strong> a été finalisé.</p>
      <p>Vous trouverez en pièce jointe la feuille de présence avec les signatures des participants.</p>
      <ul>
        <li><strong>Organisateur :</strong> ${event.organizerName}</li>
        <li><strong>Lieu :</strong> ${event.location}</li>
        <li><strong>Type de dépense :</strong> ${event.expenseType}</li>
      </ul>
      <p>Cordialement,<br>
      <strong>c-sign</strong><br>
      Ceva Santé Animale</p>
    </body>
    </html>
  `
}
```

### Environment Variables (.env)

```bash
# backend/.env.local
# SMTP Configuration (development: use Ethereal or Mailtrap)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-ethereal-user@ethereal.email
SMTP_PASS=your-ethereal-password
SMTP_FROM_EMAIL=noreply@ceva.com

# Production example (SendGrid)
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=apikey
# SMTP_PASS=SG.xxxxxxxxxxxx
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| xlsx (SheetJS) | ExcelJS | 2024-2025 | Better TypeScript support, native image embedding, more active maintenance |
| Jimp (pure JS) | Sharp (libvips) | 2023-2024 | 10x performance improvement, native dependencies worth the tradeoff |
| SendGrid/Mailgun client libraries | Nodemailer SMTP | Ongoing | Vendor-agnostic, works with any SMTP provider, simpler for low volume |
| File-based XLSX templates | In-memory generation | 2023-2024 | No file I/O, works in serverless/containers, dynamic structure |
| Custom email HTML | Payload email adapter templates | 2024-2025 | Consistent styling, better Outlook compatibility, less boilerplate |
| Synchronous export (blocking) | Async background job | Current best practice | Don't block HTTP response, better UX, handle failures gracefully |

**Deprecated/outdated:**
- **xlsx (SheetJS) for image embedding**: Still works but ExcelJS has better API and TypeScript types
- **Jimp for image processing**: Pure JS is convenient but too slow for production use
- **Sending email from frontend**: SMTP credentials exposure risk, use backend-only
- **Storing XLSX files on disk**: Complicates cleanup, container ephemeral storage issues, use Buffer
- **Nodemailer transport verification**: `transport.verify()` is unreliable with some providers, skip and handle send errors instead

## Open Questions

### 1. SMTP Provider Configuration
- What we know: Need SMTP server for email delivery
- What's unclear: Does Ceva have existing SMTP server credentials? Which provider (SendGrid, AWS SES, corporate Exchange)? What are sending limits?
- Recommendation: Start with Ethereal.email (fake SMTP for development), request production SMTP credentials from IT department before deployment.

### 2. Email Recipients (Beyond Organizer + Transparence)
- What we know: EXPO-02 says auto-email to transparence@ceva.com and organizer email
- What's unclear: Should CC/BCC include others (event creator's manager, compliance officer)? Should organizer be able to customize recipients?
- Recommendation: Hardcode two recipients for Phase 4, add CC/BCC fields in Phase 6 if needed.

### 3. Export Re-generation (Manual Download of Old Events)
- What we know: EXPO-04 says "organizer can manually download XLSX from dashboard"
- What's unclear: Is export generated once and stored, or re-generated on-demand? If stored, where (database blob, S3)? If re-generated, what if signatures are deleted later?
- Recommendation: Re-generate on-demand (simpler, no storage costs), assume signatures are immutable once event finalized.

### 4. Signature Image Format Requirements
- What we know: PLAT-04 says optimize to 200x100px
- What's unclear: Must signatures preserve transparency (PNG)? Or can we convert to JPEG (white background)? What quality level is acceptable?
- Recommendation: Convert to JPEG with white background (3-5x smaller), quality 80 (good balance). Signatures on white paper anyway.

### 5. Large Event Handling (100+ Participants)
- What we know: EXPO-06 says "file size stays under 8MB for 50+ participant events"
- What's unclear: What is the absolute maximum participant count? Should we warn/block finalization for very large events? Should we implement pagination or split exports?
- Recommendation: Support up to 100 participants in single file. Add warning at 75+. Implement split exports in Phase 6 if needed.

### 6. Email Failure Handling
- What we know: Email is triggered by afterChange hook
- What's unclear: If email fails (SMTP timeout, invalid recipient), should we retry? Should we mark event as "export pending"? Should organizer receive notification?
- Recommendation: Log error but don't block finalization. Organizer can always manually download. Add "resend email" button in Phase 6 if needed.

## Sources

### Primary (HIGH confidence)
- [ExcelJS npm documentation](https://www.npmjs.com/package/exceljs) - XLSX generation, image embedding, Buffer output
- [Sharp official documentation](https://sharp.pixelplumbing.com/) - Image resizing, format conversion, Buffer processing
- [Payload CMS Email Documentation](https://payloadcms.com/docs/email/overview) - Email adapter configuration
- [Nodemailer Attachments](https://nodemailer.com/message/attachments/) - Attachment Buffer format
- [Next.js App Router Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route) - File download responses

### Secondary (MEDIUM confidence)
- [Mailtrap Email Size Limits Guide](https://mailtrap.io/blog/email-size/) - SMTP attachment limits by provider
- [ExcelJS GitHub Issues #1029](https://github.com/exceljs/exceljs/issues/1029) - Image anchor coordinate system
- [Sharp Output Options](https://sharp.pixelplumbing.com/api-output/) - toBuffer() method
- [Payload Local API Documentation](https://payloadcms.com/docs/local-api/overview) - User context in route handlers

### Tertiary (LOW confidence - needs verification)
- [ExcelJS Image Embedding Tutorial (Medium)](https://medium.com/@python-javascript-php-html-css/utilizing-javascript-in-a-chrome-extension-to-insert-images-into-excel-cells-e0c492c9d679) - Practical examples
- [ExcelJS GitHub Discussions #2839](https://github.com/exceljs/exceljs/discussions/2839) - Place in cell feature requests
- Community examples and Stack Overflow threads for specific implementation patterns

## Metadata

**Confidence breakdown:**
- XLSX generation (ExcelJS): MEDIUM-HIGH - Verified via npm docs and GitHub, image embedding examples exist but not officially documented in detail
- Image optimization (Sharp): HIGH - Already installed, official docs comprehensive, Buffer-to-Buffer pattern verified
- Email delivery (Payload + Nodemailer): MEDIUM-HIGH - Official Payload docs exist, Nodemailer is well-documented, adapter configuration verified
- File downloads (Next.js): HIGH - Official Next.js docs, Response API is standard web platform
- Overall architecture: MEDIUM-HIGH - Patterns combine verified libraries, some integration points inferred from common practices

**Research date:** 2026-02-13
**Valid until:** 2026-03-15 (30 days - stable ecosystem, core libraries unlikely to have breaking changes)

**Notes:**
- No CONTEXT.md exists — all implementation decisions at Claude's discretion
- Sharp already installed in backend/package.json from Phase 1
- ExcelJS and email adapter are new dependencies for Phase 4
- Backend already has custom route handler pattern established (qr-code/route.ts in Phase 2)
- Event status workflow already validated in beforeChange hook (Phase 1)
- Organizer email field already exists on Events collection (Phase 1)
