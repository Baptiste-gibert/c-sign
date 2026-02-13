# Phase 02: Public Signature Flow - Research

**Researched:** 2026-02-13
**Domain:** Mobile-first public web forms, QR code deep linking, touch signature capture, multipart file uploads
**Confidence:** MEDIUM-HIGH

## Summary

Phase 2 implements a public-facing signature flow where external participants scan a QR code, fill a form, draw their signature on a touch-enabled canvas, and submit — all without authentication. This is a mobile-first, public-access flow that requires special attention to touch UX, iOS Safari quirks, immediate file uploads (avoiding memory issues), and access control configuration.

**Primary recommendation:** Use react-signature-canvas + signature_pad for signature capture (battle-tested on iOS/Android), qrcode.react for QR generation (native TypeScript support), configure Payload access control with `create: () => true` for public submission, and scaffold Vite frontend with Tailwind v4 + shadcn/ui following official setup guides.

**Critical insight:** Frontend must be scaffolded first (Phase 2 is first frontend work). Canvas resizing on iOS Safari is a known pitfall — lock orientation or handle resize events carefully. Signature must upload immediately as blob via multipart/form-data to avoid PowerApps-style memory crashes.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-signature-canvas | 1.1.0-alpha.2+ | Touch signature capture | React wrapper around signature_pad, 100% test coverage, TypeScript support, battle-tested on mobile |
| signature_pad | 5.x+ | Underlying signature library | HTML5 canvas with Bézier curve interpolation, iOS Safari touch fixes, 5k+ GitHub stars |
| qrcode.react | 4.x+ | QR code generation (frontend display) | Native TypeScript support, SVG/Canvas render options, React-native integration |
| qrcode | 1.5.x+ | QR code generation (backend API) | Node.js standard, generates data URLs or buffers for embedding |
| React Hook Form | 7.x | Form state management | Minimal re-renders, built-in validation, mobile-friendly |
| Zod | 3.x | Schema validation | Type-safe validation shared between frontend/backend |
| Vite | 6.x | Frontend build tool | Fast HMR, native ESM, official React template |
| Tailwind CSS | 4.x | Utility-first styling | v4 uses Vite plugin (@tailwindcss/vite), improved mobile hover handling |
| shadcn/ui | Latest | Component library | Radix UI primitives + Tailwind, copy-paste components, mobile-optimized |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| libphonenumber-js | Latest | Phone number validation | If registration number format varies by country |
| @hookform/resolvers | Latest | Zod integration with React Hook Form | Always — connects Zod schemas to forms |
| class-variance-authority | Latest | Component variant management | For shadcn/ui components |
| clsx / tailwind-merge | Latest | Conditional CSS classes | For shadcn/ui utilities |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-signature-canvas | react-native-signature-canvas | Native version is for React Native apps, not web |
| qrcode.react | react-qr-code | Both work, qrcode.react has native TS types vs @types package |
| Tailwind CSS v4 | Tailwind CSS v3 | v3 uses PostCSS config, v4 uses Vite plugin — v4 is current standard for 2026 |

**Installation:**

Frontend:
```bash
cd /workspace/frontend

# Initialize Vite + React + TypeScript
npm create vite@latest . -- --template react-ts

# Core dependencies
npm install react@latest react-dom@latest react-router-dom

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Signature & QR
npm install react-signature-canvas signature_pad qrcode.react
npm install -D @types/qrcode.react

# UI & Styling
npm install tailwindcss @tailwindcss/vite
npm install class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-select @radix-ui/react-slot
npm install lucide-react

# shadcn/ui setup
npx shadcn@latest init
npx shadcn@latest add button card input label select
```

Backend (QR generation API):
```bash
cd /workspace/backend
npm install qrcode
npm install -D @types/qrcode
```

## Architecture Patterns

### Recommended Project Structure

Frontend (`/workspace/frontend`):
```
frontend/
├── src/
│   ├── app/                 # Routes
│   │   ├── sign/
│   │   │   └── [dayId]/
│   │   │       └── page.tsx # Public signing page
│   │   └── success/
│   │       └── page.tsx     # Confirmation page
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── SignatureCanvas.tsx
│   │   ├── ParticipantForm.tsx
│   │   └── QRCodeDisplay.tsx
│   ├── hooks/
│   │   └── use-signature-submission.ts # TanStack Query mutation
│   ├── lib/
│   │   ├── api.ts           # Payload REST API client
│   │   ├── utils.ts         # cn() helper
│   │   └── schemas.ts       # Zod validation schemas
│   ├── types/
│   │   └── payload.ts       # Generated Payload types
│   └── main.tsx
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

Backend (`/workspace/backend`):
```
backend/src/
├── app/
│   └── (payload)/
│       └── api/
│           └── qr-code/
│               └── route.ts  # GET /api/qr-code?dayId=123
├── collections/
│   ├── Signatures.ts         # Update access control: create: () => true
│   └── Participants.ts       # Update access control: create: () => true
└── payload.config.ts
```

### Pattern 1: Public Access Control (Payload CMS 3)

**What:** Configure collections to allow anonymous users to create documents without authentication.

**When to use:** Public submission endpoints (signatures, contact forms, registrations).

**Example:**
```typescript
// backend/src/collections/Signatures.ts
import { CollectionConfig } from 'payload'

export const Signatures: CollectionConfig = {
  slug: 'signatures',
  access: {
    // CRITICAL: Allow public creation
    create: () => true,
    // Restrict reads to authenticated users
    read: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    // ... existing fields
  ],
}
```

**Security note:** Only use `create: () => true` for specific public endpoints. Add server-side validation in beforeChange hooks to prevent abuse.

### Pattern 2: Mobile-First Signature Canvas

**What:** Touch-enabled signature canvas that works on iOS Safari and Android Chrome, with proper canvas sizing and event handling.

**When to use:** Any signature capture on mobile devices.

**Example:**
```typescript
// frontend/src/components/SignatureCanvas.tsx
import { useRef, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'

export function SignatureCanvasField() {
  const sigCanvas = useRef<SignatureCanvas>(null)

  // CRITICAL: Lock canvas size to prevent iOS Safari resize issues
  useEffect(() => {
    const canvas = sigCanvas.current?.getCanvas()
    if (!canvas) return

    // Set explicit dimensions (not via CSS width/height)
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
    }
  }, [])

  const handleClear = () => {
    sigCanvas.current?.clear()
  }

  const getSignatureBlob = async (): Promise<Blob | null> => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      return null
    }

    // Convert to blob (not data URL) for immediate upload
    return new Promise((resolve) => {
      sigCanvas.current
        ?.getTrimmedCanvas()
        .toBlob((blob) => resolve(blob), 'image/png')
    })
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <SignatureCanvas
        ref={sigCanvas}
        canvasProps={{
          className: 'w-full h-48 touch-none', // touch-none = disable browser gestures
        }}
        backgroundColor="rgb(255, 255, 255)"
      />
      <button onClick={handleClear} type="button">Clear</button>
    </div>
  )
}
```

**Source:** [react-signature-canvas GitHub](https://github.com/agilgur5/react-signature-canvas)

### Pattern 3: Immediate File Upload (Avoid Memory Crashes)

**What:** Upload signature as blob via FormData immediately after capture, never store multiple signatures in client memory.

**When to use:** All file uploads in the signing flow.

**Example:**
```typescript
// frontend/src/hooks/use-signature-submission.ts
import { useMutation } from '@tanstack/react-query'

interface SignatureData {
  participant: string
  session: string
  signatureBlob: Blob
  consentRightToImage: boolean
}

export function useSignatureSubmission() {
  return useMutation({
    mutationFn: async (data: SignatureData) => {
      const formData = new FormData()

      // Append file first
      formData.append('file', data.signatureBlob, 'signature.png')

      // Append JSON metadata via _payload field (Payload 3.x pattern)
      formData.append('_payload', JSON.stringify({
        participant: data.participant,
        session: data.session,
        consentRightToImage: data.consentRightToImage,
      }))

      const response = await fetch('/api/signatures', {
        method: 'POST',
        body: formData, // Send as multipart/form-data
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Submission failed')
      }

      return response.json()
    },
  })
}
```

**Source:** [Payload CMS 3 Upload Documentation](https://payloadcms.com/docs/upload/overview)

### Pattern 4: QR Code Generation with Deep Linking

**What:** Generate QR codes that encode URLs with deep link parameters (attendance day ID, session ID).

**When to use:** Organizer dashboard, QR code download/display.

**Example:**

Backend API route:
```typescript
// backend/src/app/(payload)/api/qr-code/route.ts
import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const dayId = searchParams.get('dayId')

  if (!dayId) {
    return NextResponse.json({ error: 'dayId required' }, { status: 400 })
  }

  // Construct deep link URL
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:5173'
  const signUrl = `${baseUrl}/sign/${dayId}`

  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(signUrl, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: 'M',
  })

  return NextResponse.json({ qrDataUrl, signUrl })
}
```

Frontend display:
```typescript
// frontend/src/components/QRCodeDisplay.tsx
import { QRCodeSVG } from 'qrcode.react'

interface QRCodeDisplayProps {
  dayId: string
}

export function QRCodeDisplay({ dayId }: QRCodeDisplayProps) {
  const signUrl = `${window.location.origin}/sign/${dayId}`

  return (
    <div className="flex flex-col items-center gap-4">
      <QRCodeSVG
        value={signUrl}
        size={256}
        level="M"
        includeMargin
      />
      <p className="text-sm text-gray-600">{signUrl}</p>
    </div>
  )
}
```

### Pattern 5: Mobile-First Form with Proper Keyboard Types

**What:** Use correct HTML input types and inputMode to trigger appropriate mobile keyboards.

**When to use:** All mobile forms.

**Example:**
```typescript
// frontend/src/components/ParticipantForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const participantSchema = z.object({
  lastName: z.string().min(1, 'Required'),
  firstName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  city: z.string().min(1, 'Required'),
  registrationNumber: z.string().optional(),
  beneficiaryType: z.enum(['veterinaire', 'pharmacien', 'etudiant', 'asv', 'technicien', 'eleveur', 'autre']),
  consentRightToImage: z.boolean(),
})

export function ParticipantForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(participantSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('lastName')}
        type="text"
        autoComplete="family-name"
        className="min-h-[44px]" // iOS touch target minimum
      />

      <input
        {...register('email')}
        type="email" // Triggers email keyboard on mobile
        inputMode="email"
        autoComplete="email"
        className="min-h-[44px]"
      />

      <input
        {...register('registrationNumber')}
        type="tel" // Use tel for registration numbers (allows formatting)
        inputMode="numeric"
        className="min-h-[44px]"
      />
    </form>
  )
}
```

**Source:** [Mobile Form Best Practices](https://ivyforms.com/blog/mobile-form-best-practices/)

### Pattern 6: Vite + Tailwind v4 Setup (2026 Standard)

**What:** Initialize Vite with Tailwind v4 using @tailwindcss/vite plugin (not PostCSS).

**When to use:** All new Vite projects in 2026.

**Example:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

```typescript
// tsconfig.json (paths for shadcn/ui)
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

```css
/* src/index.css */
@import "tailwindcss";
```

**Source:** [Tailwind CSS Vite Installation](https://tailwindcss.com/docs/installation/framework-guides/vite)

### Anti-Patterns to Avoid

- **Canvas resize listeners without throttling** — iOS Safari fires resize on scroll, clearing canvas. Lock orientation or throttle resize handlers.
- **Storing signatures as data URLs in state** — Large data URLs cause memory bloat. Convert to blob immediately.
- **Using type="number" for phone/registration numbers** — Breaks formatting, doesn't allow dashes/spaces. Use type="tel" instead.
- **Setting canvas size via CSS width/height** — Causes blurry signatures. Set canvas.width/height attributes directly, accounting for devicePixelRatio.
- **Relying on :hover states on mobile** — Causes stuck hovers on touch devices. Tailwind v4 fixes this with @media (hover: hover).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| QR code generation | Custom QR encoder | qrcode (backend), qrcode.react (frontend) | Complex error correction algorithms, battle-tested across scanners |
| Signature canvas smoothing | Raw canvas event handlers | signature_pad via react-signature-canvas | Bézier curve interpolation, pressure sensitivity, iOS Safari touch fixes |
| Form validation | Manual field checking | React Hook Form + Zod | Re-render optimization, TypeScript inference, async validation, error handling |
| Mobile keyboard triggering | Generic text inputs | Proper type/inputMode attributes | iOS/Android have built-in keyboards for email, tel, numeric |
| File upload handling | XMLHttpRequest or fetch with manual headers | FormData API | Handles multipart boundaries, file streaming, MIME types automatically |
| Touch target sizing | Arbitrary px values | 44px minimum (iOS), 48px recommended (Material) | Platform guidelines, accessibility standards |

**Key insight:** PowerApps POC failed because it stored all signatures in client memory. Immediate upload via FormData solves this.

## Common Pitfalls

### Pitfall 1: iOS Safari Canvas Clears on Scroll/Resize

**What goes wrong:** User draws signature, scrolls page, canvas clears itself. This is due to iOS Safari's URL bar auto-hide behavior triggering resize events.

**Why it happens:** iOS Safari resizes viewport when URL bar hides/shows. Canvas resize clears canvas content (browser behavior).

**How to avoid:**
- Lock canvas dimensions (no responsive resizing)
- Use `meta viewport` with `user-scalable=no` for signature page only
- Debounce resize listeners (>300ms delay)
- Store signature data before resize, redraw after

**Warning signs:**
- Canvas appears blank after user scrolls
- Signature disappears when keyboard opens/closes
- Users report "signature keeps erasing itself"

**Source:** [signature_pad Issue #65](https://github.com/agilgur5/react-signature-canvas/issues/65)

### Pitfall 2: Blurry Signatures on High-DPI Displays

**What goes wrong:** Signature looks pixelated on iPhone Retina displays.

**Why it happens:** Canvas CSS size doesn't match actual pixel dimensions. devicePixelRatio=2 means 1 CSS pixel = 2 physical pixels.

**How to avoid:**
```typescript
const dpr = window.devicePixelRatio || 1
canvas.width = cssWidth * dpr
canvas.height = cssHeight * dpr
ctx.scale(dpr, dpr)
```

**Warning signs:** Signatures look sharp on desktop, blurry on mobile.

### Pitfall 3: Payload Access Control Blocks Public Submission

**What goes wrong:** Public users get 401 Unauthorized when submitting signature.

**Why it happens:** Payload defaults to requiring authentication for all operations.

**How to avoid:**
- Set `access.create: () => true` in collection config
- Add server-side validation in beforeChange hook (rate limiting, field validation)
- Use CSRF protection (Payload has built-in cookie-based CSRF)

**Warning signs:**
- 401 errors in browser console on form submit
- Postman works with auth token, frontend doesn't

**Source:** [Payload CMS Access Control](https://payloadcms.com/docs/access-control/collections)

### Pitfall 4: FormData File Upload Missing _payload Field

**What goes wrong:** File uploads, but associated metadata (participant ID, session ID) doesn't save.

**Why it happens:** Payload 3.x requires additional fields to be JSON-stringified in a `_payload` field when uploading via multipart/form-data.

**How to avoid:**
```typescript
formData.append('file', blob, 'signature.png')
formData.append('_payload', JSON.stringify({
  participant: participantId,
  session: sessionId,
}))
```

**Warning signs:**
- File appears in Media collection
- Relationships/fields are null in Signature document

**Source:** [Payload Upload REST API](https://payloadcms.com/community-help/discord/upload-files-via-the-rest-api)

### Pitfall 5: Mobile Form Inputs Too Small / Wrong Keyboard

**What goes wrong:** Users struggle to tap inputs, keyboard doesn't match field type.

**Why it happens:** Default input heights are <44px, input type="text" for all fields.

**How to avoid:**
- Minimum 44px height (iOS guideline)
- Use type="email" for email (shows @ key)
- Use type="tel" for phone/registration (shows numeric keypad)
- Add inputMode="numeric" for numbers-only
- Single-column layout, labels above inputs

**Warning signs:**
- High tap error rate on mobile
- Users complain about keyboard switching

**Source:** [Mobile Form Best Practices](https://www.formsonfire.com/blog/mobile-form-design)

### Pitfall 6: Hover States Stuck on Touch Devices (Tailwind v3)

**What goes wrong:** Button stays in hover state after tap on mobile.

**Why it happens:** CSS :hover applies on touch, doesn't clear after tap ends.

**How to avoid:** Use Tailwind v4, which wraps hover variants in @media (hover: hover) automatically.

**Warning signs:** Buttons look "stuck" in hover state after tap.

**Source:** [Tailwind CSS v4 Hover on Touch](https://bordermedia.org/blog/tailwind-css-4-hover-on-touch-device)

### Pitfall 7: Success Confirmation Gets Lost on Redirect

**What goes wrong:** User submits form, sees loading spinner, then lands on blank success page with no message.

**Why it happens:** React state doesn't persist across route changes.

**How to avoid:**
- Use query parameters: `/success?status=submitted`
- Use session storage for flash messages
- Use React Router state: `navigate('/success', { state: { message: 'Success!' } })`

**Warning signs:** Users unsure if submission worked, submit multiple times.

## Code Examples

Verified patterns from official sources:

### Complete Signature Submission Flow

```typescript
// frontend/src/app/sign/[dayId]/page.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { useMutation } from '@tanstack/react-query'

const signatureSchema = z.object({
  lastName: z.string().min(1, 'Nom requis'),
  firstName: z.string().min(1, 'Prénom requis'),
  email: z.string().email('Email invalide'),
  city: z.string().min(1, 'Ville requise'),
  registrationNumber: z.string().optional(),
  beneficiaryType: z.enum(['veterinaire', 'pharmacien', 'etudiant', 'asv', 'technicien', 'eleveur', 'autre']),
  consentRightToImage: z.boolean(),
})

export default function SignPage() {
  const { dayId } = useParams()
  const navigate = useNavigate()
  const sigCanvas = useRef<SignatureCanvas>(null)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signatureSchema),
  })

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof signatureSchema>) => {
      // Get signature blob
      const canvas = sigCanvas.current
      if (!canvas || canvas.isEmpty()) {
        throw new Error('Signature requise')
      }

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.getTrimmedCanvas().toBlob((b) => resolve(b), 'image/png')
      })

      if (!blob) throw new Error('Erreur signature')

      // First, create participant
      const participantRes = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastName: data.lastName,
          firstName: data.firstName,
          email: data.email,
          city: data.city,
          registrationNumber: data.registrationNumber,
          beneficiaryType: data.beneficiaryType,
        }),
      })

      if (!participantRes.ok) throw new Error('Erreur création participant')
      const participant = await participantRes.json()

      // Then, upload signature with relationships
      const formData = new FormData()
      formData.append('file', blob, 'signature.png')
      formData.append('_payload', JSON.stringify({
        participant: participant.doc.id,
        session: sessionId, // From context/URL
        consentRightToImage: data.consentRightToImage,
      }))

      const sigRes = await fetch('/api/signatures', {
        method: 'POST',
        body: formData,
      })

      if (!sigRes.ok) throw new Error('Erreur envoi signature')
      return sigRes.json()
    },
    onSuccess: () => {
      navigate('/success')
    },
  })

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
      {/* Form fields... */}

      <div className="border rounded-lg">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'w-full h-48 touch-none',
          }}
          backgroundColor="#fff"
        />
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="min-h-[44px] w-full"
      >
        {mutation.isPending ? 'Envoi...' : 'Signer'}
      </button>

      {mutation.isError && (
        <p className="text-red-600">{mutation.error.message}</p>
      )}
    </form>
  )
}
```

**Source:** [React Hook Form + Zod](https://www.freecodecamp.org/news/react-form-validation-zod-react-hook-form/)

### QR Code Display with Download

```typescript
// frontend/src/components/QRCodeDisplay.tsx
import { QRCodeSVG } from 'qrcode.react'
import { Download } from 'lucide-react'

interface QRCodeDisplayProps {
  dayId: string
  dayLabel: string
}

export function QRCodeDisplay({ dayId, dayLabel }: QRCodeDisplayProps) {
  const signUrl = `${window.location.origin}/sign/${dayId}`

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = `qr-code-${dayLabel}.svg`
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
      <h3 className="font-semibold">{dayLabel}</h3>
      <QRCodeSVG
        id="qr-code-svg"
        value={signUrl}
        size={256}
        level="M"
        includeMargin
      />
      <p className="text-sm text-gray-600 break-all">{signUrl}</p>
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded"
      >
        <Download size={16} />
        Télécharger QR Code
      </button>
    </div>
  )
}
```

### Next.js 15 API Route for File Upload

```typescript
// backend/src/app/(payload)/api/signatures/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const formData = await req.formData()

    const file = formData.get('file') as File
    const payloadData = formData.get('_payload') as string

    if (!file || !payloadData) {
      return NextResponse.json(
        { error: 'Missing file or metadata' },
        { status: 400 }
      )
    }

    const metadata = JSON.parse(payloadData)

    // Payload Local API handles file upload + document creation
    const result = await payload.create({
      collection: 'signatures',
      data: {
        participant: metadata.participant,
        session: metadata.session,
        consentRightToImage: metadata.consentRightToImage,
      },
      file: {
        data: Buffer.from(await file.arrayBuffer()),
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Signature upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
```

**Source:** [Next.js 15 File Upload](https://strapi.io/blog/epic-next-js-15-tutorial-part-5-file-upload-using-server-actions)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 PostCSS config | Tailwind v4 @tailwindcss/vite plugin | Jan 2025 | Faster builds, built-in hover media query fix for touch devices |
| signature_pad v4 | signature_pad v5 | 2024 | TypeScript rewrite, better tree-shaking |
| QR code server-side only | QR code client-side + server-side | 2024+ | Zero backend load for display, instant generation |
| Storing signatures in client state | Immediate upload as blob | 2024 (post-PowerApps failure) | Prevents memory crashes, enables offline recovery |
| Manual form validation | React Hook Form + Zod | 2023+ | Type-safe, minimal re-renders, shared schemas |
| PWA requires manifest | PWA auto-detected by iOS 26 | iOS 26 (2026) | Easier "Add to Home Screen", better app-like experience |

**Deprecated/outdated:**
- **react-signature-pad**: Unmaintained fork, use react-signature-canvas instead (active maintenance, 100% test coverage)
- **Tailwind v3 without hover media query**: Causes stuck hover states on mobile — upgrade to v4
- **Canvas sizing via CSS width/height**: Always caused blur on high-DPI — set canvas.width/height attributes

## Open Questions

1. **Session Selection Logic**
   - What we know: QR code links to attendance day (dayId)
   - What's unclear: Does user select morning/afternoon session in UI, or is it auto-detected by time of day?
   - Recommendation: Add session selection radio buttons in form (explicit > implicit)

2. **Duplicate Signature Prevention**
   - What we know: Phase 1 implemented beforeChange hook for uniqueness (one signature per participant-session)
   - What's unclear: Should UI prevent resubmission (check existing signature on load), or let backend reject?
   - Recommendation: Backend-only validation for Phase 2 (simpler), add UI check in Phase 3 if needed

3. **QR Code Display Location**
   - What we know: Organizer needs QR code for each attendance day
   - What's unclear: Display in admin UI, or separate organizer frontend page?
   - Recommendation: Phase 2 can use simple Next.js page at `/qr-code/[dayId]` (admin UI is Phase 3+)

4. **Rate Limiting / Abuse Prevention**
   - What we know: Public endpoint allows anyone to create signatures
   - What's unclear: Risk of spam/bot submissions, need for rate limiting?
   - Recommendation: Start without rate limiting (internal use case, low risk), add if abuse detected

5. **Offline Support**
   - What we know: Vite can be configured as PWA, signatures could be queued offline
   - What's unclear: Is offline support a requirement (not in FR list)?
   - Recommendation: Out of scope for Phase 2 — online-only is sufficient for initial POC

## Sources

### Primary (HIGH confidence)

- [Payload CMS Access Control Documentation](https://payloadcms.com/docs/access-control/collections) - Public access configuration
- [Payload CMS Upload Documentation](https://payloadcms.com/docs/upload/overview) - File upload via REST API with _payload field
- [Tailwind CSS Vite Installation](https://tailwindcss.com/docs/installation/framework-guides/vite) - Official v4 Vite setup
- [shadcn/ui Vite Installation](https://ui.shadcn.com/docs/installation/vite) - Official component setup
- [signature_pad GitHub](https://github.com/szimek/signature_pad) - Core signature library
- [react-signature-canvas GitHub](https://github.com/agilgur5/react-signature-canvas) - React wrapper
- [qrcode.react GitHub](https://github.com/zpao/qrcode.react) - QR generation

### Secondary (MEDIUM confidence)

- [How to Build a QR Code Generator with Node.js and Next.js](https://www.freecodecamp.org/news/build-a-qr-code-generator-using-nodejs-nextjs-azure-blob-storage/) - Backend QR generation
- [React Hook Form + Zod Guide](https://www.freecodecamp.org/news/react-form-validation-zod-react-hook-form/) - Form validation pattern
- [Tailwind CSS v4 Hover on Touch Devices](https://bordermedia.org/blog/tailwind-css-4-hover-on-touch-device) - Mobile hover fix
- [Mobile Form Best Practices](https://ivyforms.com/blog/mobile-form-best-practices/) - Touch targets, keyboard types
- [Next.js 15 File Upload with Server Actions](https://strapi.io/blog/epic-next-js-15-tutorial-part-5-file-upload-using-server-actions) - File handling
- [HTMLCanvasElement.toBlob() - MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) - Canvas to blob conversion

### Tertiary (LOW confidence - WebSearch only, needs verification)

- [react-signature-canvas Issue #65](https://github.com/agilgur5/react-signature-canvas/issues/65) - iOS Safari canvas clearing bug
- [signature_pad Issue #268](https://github.com/szimek/signature_pad/issues/268) - Canvas resize handling
- [PWA on iOS Current Status 2026](https://brainhub.eu/library/pwa-on-ios) - iOS 26 PWA changes
- [npm-compare: QR Code Libraries](https://npm-compare.com/qr-code-styling,qr.js,qrcode.react,qrious,react-qr-code) - Library comparison

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs + npm package stats confirm current standard
- Architecture: MEDIUM-HIGH - Payload patterns verified in official docs, React patterns from trusted sources
- Pitfalls: MEDIUM - iOS Safari canvas issue confirmed in GitHub issues, other pitfalls from community best practices

**Research date:** 2026-02-13
**Valid until:** ~2026-03-15 (30 days - stable ecosystem, but Vite/Tailwind move fast)

**Key risks:**
- Frontend scaffolding is first frontend work — setup errors will block all tasks
- iOS Safari signature canvas issues require careful testing on real devices
- Public access control requires server-side validation to prevent abuse

**Next steps for planner:**
1. Create plan for Vite frontend scaffolding (prerequisite for all other tasks)
2. Create plan for Payload access control + public endpoints
3. Create plan for signature capture UI with iOS Safari testing
4. Create plan for form submission + file upload
5. Create plan for QR code generation (backend + frontend display)
