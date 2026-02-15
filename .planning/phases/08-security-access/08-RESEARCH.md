# Phase 8: Security & Access - Research

**Researched:** 2026-02-15
**Domain:** Web application security hardening (authentication, authorization, input validation, abuse prevention)
**Confidence:** MEDIUM-HIGH

## Summary

Phase 8 hardens c-sign for public deployment by implementing defense-in-depth security across authentication, public endpoints, input validation, and file uploads. The user has made clear decisions about authentication policies (24h sessions, 5-attempt lockout, admin-only unlock), public endpoint protection (unguessable tokens, device-based rate limiting, dynamic CAPTCHA), and input safety (server-side sanitization, Sharp re-encoding).

Research confirms that Payload CMS 3 provides built-in authentication hardening features (maxLoginAttempts, lockTime, cookie configuration) that align with requirements. Device fingerprinting via FingerprintJS (open-source) provides the non-IP-based rate limiting needed for shared WiFi scenarios. Cloudflare Turnstile emerges as the strongest CAPTCHA option with invisible/managed modes, privacy compliance, and no reCAPTCHA-style tracking.

Key finding: **The current codebase has public create access on Participants, Signatures, and Media collections with zero abuse prevention**. This is intentional for the public signing flow but requires immediate hardening before production deployment.

**Primary recommendation:** Layer multiple defenses (unguessable tokens + device fingerprinting + dynamic CAPTCHA + Sharp re-encoding + HTML sanitization) rather than relying on any single mechanism. Attackers bypass individual defenses; defense-in-depth forces them to defeat multiple independent systems.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Authentication hardening:**
- Session expiry: 24 hours — organizers re-login daily
- Password policy: moderate — 8+ characters, mixed case + at least one number
- Brute-force protection: lock account after 5 failed attempts — only an admin can unlock via Payload admin panel (no self-service unlock, no timer)
- No self-service password reset — admins handle resets manually (small user base)
- Registration: admin-only — no public registration endpoint, admins create organizer accounts in Payload admin
- Payload admin panel (/admin): restricted to admin role only — organizers use only the frontend app
- No IP/geographic restrictions on login
- Multiple concurrent sessions allowed (phone + laptop use case)
- Cookie hardening: SameSite=Strict, Secure flag, HttpOnly, 24h expiry

**Public endpoint protection:**
- **Signing URL tokens**: Random unguessable tokens instead of sequential IDs — prevents brute-force URL enumeration (e.g., `/sign/a7f3b2c9...` not `/sign/5`)
- Token validity: tied to event lifecycle — valid while event is open/reopened, invalid when finalized/draft
- **Token regeneration**: Organizer can regenerate QR token to invalidate old one if link is compromised/shared publicly
- **Spam prevention strategy**: Device fingerprint-based rate limiting (NOT IP-based — attendees share WiFi in event rooms) + dynamic CAPTCHA that triggers only when suspicious volume detected (not on every submission)
- Device-based rate limiting covers both signing submissions and mass participant creation
- Email validation: format check only (no MX record lookup, no disposable email blocking)
- Duplicate signing: keep current behavior — one signature per participant-session pair (enforced via existing beforeChange hook)

**API security:**
- CSRF token per session for public API endpoints (Claude's discretion on implementation — stronger than static app key)
- CORS: locked to same-origin + production URL only — blocks external scripts from calling API
- Keep detailed error responses (schema info not considered secret for this app)

**Input sanitization & upload safety:**
- Server-side HTML/script tag stripping on all participant text inputs (names, cities, registration numbers) before storage — defense-in-depth beyond React's JSX escaping
- Signature image uploads re-encoded through Sharp server-side — strips metadata, destroys embedded payloads (polyglot file attacks), validates actual image content
- Strict file validation: PNG/JPEG only, max 2MB, magic byte verification (not just extension check)

**Production configuration:**
- Disable GraphQL playground in production (Payload config flag)
- Disable Payload API explorer in production
- Security headers middleware (Claude's discretion): CSP, X-Frame-Options, HSTS, X-Content-Type-Options

### Claude's Discretion

- HTTP security headers selection and strictness levels
- CSRF token implementation approach (per-session token mechanism)
- Device fingerprinting library/approach for rate limiting
- Dynamic CAPTCHA threshold and provider choice
- Exact random token format and length for signing URLs
- Sharp re-encoding pipeline configuration

### Deferred Ideas (OUT OF SCOPE)

- Audit logging (auth events, status changes, export downloads) — future phase
- GDPR-specific PII handling and data retention policies — future phase

</user_constraints>

## Standard Stack

### Core Security Libraries
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Payload CMS 3.x** | ^3.0.0 | Built-in auth hardening | Provides maxLoginAttempts, lockTime, cookie config, unlock operations out-of-box |
| **Sharp** | ^0.33.5 | Image re-encoding security | Already in project. Default metadata stripping, format conversion destroys polyglot attacks |
| **@fingerprintjs/fingerprintjs** | ^4.5.1 (latest) | Device fingerprinting | MIT license, 40-60% accuracy sufficient for abuse detection (not fraud prevention), runs client-side, privacy-friendly compared to commercial alternatives |
| **@cloudflare/turnstile** | latest | Invisible/managed CAPTCHA | Privacy-compliant (GDPR/CCPA/ePrivacy), invisible mode available, no Google tracking, rotating JS challenges, free tier generous |
| **isomorphic-dompurify** | ^2.16.0 | HTML sanitization | Works server-side (jsdom) and client-side, strips XSS vectors, widely trusted (DOMPurify = industry standard) |
| **nanoid** | ^5.0.9 | Secure token generation | 21-char default = ~126 bits entropy (vs UUID's ~122), URL-safe, crypto.random-based, smaller than UUID |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **file-type** | ^19.7.0 | Magic byte validation | Validates PNG/JPEG signatures from Buffer, defense beyond MIME type checks |
| **@edge-csrf/nextjs** | ^2.2.0 | CSRF protection | Per-session tokens via middleware, works with Next.js 15 App Router, edge runtime compatible |
| **rate-limit-redis** (optional) | ^4.2.0 | Distributed rate limiting | Only if Redis is added — enables shared rate limit state across instances (not needed for single Vercel deployment) |

### Already Available (No Install)
- **Zod** (^3.23.8): Password validation schemas
- **Next.js 15** (15.4.11): Security headers via middleware
- **crypto (Node.js built-in)**: Fallback for crypto.randomBytes if nanoid not used

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| FingerprintJS (open-source) | Fingerprint Pro (commercial) | Pro offers 99.5% accuracy + server-side analysis but costs $200+/mo — overkill for abuse detection (not account takeover prevention) |
| Cloudflare Turnstile | hCaptcha invisible | hCaptcha privacy model weaker, API migration trivial (nearly drop-in), Turnstile free tier better |
| nanoid | UUID v4 | UUID is 36 chars vs 21, both ~122-126 bits entropy, nanoid URL-friendlier and shorter |
| isomorphic-dompurify | sanitize-html | sanitize-html is server-only, different API, DOMPurify has broader ecosystem support |

**Installation:**
```bash
npm install @fingerprintjs/fingerprintjs @cloudflare/turnstile isomorphic-dompurify nanoid file-type @edge-csrf/nextjs
```

## Architecture Patterns

### Recommended Security Layer Structure
```
backend/src/
├── middleware.ts              # Next.js 15 middleware (security headers, CSRF)
├── lib/
│   ├── security/
│   │   ├── sanitize.ts        # HTML sanitization utilities
│   │   ├── rateLimit.ts       # Device fingerprint-based rate limiting
│   │   ├── captcha.ts         # Turnstile server-side verification
│   │   ├── tokens.ts          # Unguessable token generation/validation
│   │   └── validators.ts      # Magic byte, password validation
│   └── api-fetch.ts           # Existing (add CSRF token injection)
├── collections/
│   ├── Users.ts               # Add auth config (maxLoginAttempts, cookies)
│   ├── Participants.ts        # Add beforeChange hook (sanitize input)
│   ├── Media.ts               # Add upload hooks (Sharp re-encode)
│   └── Events.ts              # Add signingToken field
├── hooks/
│   ├── auth/
│   │   └── validatePassword.ts   # Password policy hook
│   ├── uploads/
│   │   └── reEncodeImage.ts      # Sharp re-encoding hook
│   └── sanitization/
│       └── sanitizeText.ts       # HTML stripping hook
└── payload.config.ts          # Production flags (disable GraphQL playground)
```

### Pattern 1: Defense-in-Depth Layering
**What:** Multiple independent security mechanisms protecting the same attack surface
**When to use:** Always for public endpoints — assume attackers bypass any single defense
**Example:**
```typescript
// Public signing endpoint protection layers:
// Layer 1: Unguessable token (prevents enumeration)
// Layer 2: Token lifecycle validation (prevents replay on finalized events)
// Layer 3: Device fingerprinting (detects mass automation)
// Layer 4: Dynamic CAPTCHA (triggers on suspicious fingerprint behavior)
// Layer 5: Input sanitization (prevents stored XSS)
// Layer 6: Sharp re-encoding (destroys polyglot payloads)
// Layer 7: Duplicate signature check (existing beforeChange hook)

// Attacker must defeat ALL 7 layers to successfully spam
```

### Pattern 2: Payload Auth Configuration
**What:** Configure Users collection with built-in Payload auth hardening options
**When to use:** Always — Payload's auth system provides enterprise-grade features out-of-box
**Example:**
```typescript
// Source: Payload CMS official docs (search results + inferred from docs structure)
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // Session expiry (24 hours = 86400000ms)
    tokenExpiration: 86400, // seconds, not ms (86400 = 24h)

    // Brute-force protection
    maxLoginAttempts: 5,
    lockTime: 0, // 0 = indefinite lock (admin-only unlock)

    // Cookie security
    cookies: {
      secure: true,        // HTTPS-only (Vercel enforces HTTPS)
      sameSite: 'Strict',  // CSRF protection (no cross-site requests)
      // httpOnly: true,   // Default in Payload (prevents XSS cookie theft)
      // domain: undefined // Default (same domain only)
    },

    // Disable self-service features
    forgotPassword: false, // No password reset emails (admin handles manually)

    // Email verification not needed (admins create accounts)
    verify: false,
  },
  access: {
    // Admin-only registration (existing isAdmin function)
    create: isAdmin,

    // Admin panel access (CHANGE: restrict to admin-only, not organizers)
    admin: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    // Existing fields...
  ],
  hooks: {
    beforeChange: [
      // Password validation hook (see Pattern 3)
    ]
  }
}
```

**CRITICAL CHANGE:** Current code allows `organizer` role to access admin panel (`user?.role === 'admin' || user?.role === 'organizer'`). User decision requires admin-only access. Organizers use frontend app only.

### Pattern 3: Password Policy Validation
**What:** Zod schema validates password strength on user creation/update
**When to use:** beforeChange hook on Users collection
**Example:**
```typescript
// Source: Multiple regex patterns from search results
// Pattern chosen: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
// - At least 8 characters
// - At least one lowercase letter
// - At least one uppercase letter
// - At least one number
// - Allows special chars but doesn't require them (moderate policy)

import { z } from 'zod'

const passwordSchema = z.string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caracteres')
  .regex(/(?=.*[a-z])/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/(?=.*[A-Z])/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/(?=.*\d)/, 'Le mot de passe doit contenir au moins un chiffre')

// hooks/auth/validatePassword.ts
export const validatePassword = async ({ data, operation }) => {
  if (operation === 'create' || (operation === 'update' && data.password)) {
    if (data.password) {
      try {
        passwordSchema.parse(data.password)
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(error.errors.map(e => e.message).join(', '))
        }
        throw error
      }
    }
  }
  return data
}
```

### Pattern 4: Unguessable Token Generation
**What:** Generate cryptographically secure random tokens for signing URLs
**When to use:** Event creation, token regeneration
**Example:**
```typescript
// Source: nanoid GitHub (126 bits entropy with 21 chars)
import { nanoid } from 'nanoid'

// lib/security/tokens.ts
export function generateSigningToken(): string {
  // Default: 21 chars, URL-safe alphabet (A-Za-z0-9_-)
  // ~126 bits entropy (comparable to UUID v4's ~122 bits)
  // Collision probability: negligible for millions of events
  return nanoid()
}

// Alternative: Custom alphabet/length for specific security level
import { customAlphabet } from 'nanoid'
const nanoidCustom = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 16)
// 16 chars hex = ~64 bits entropy (still strong, shorter URLs)

// Events collection change:
// Add field: signingToken (text, unique, generated on create/regenerate)
// Public signing URL: /sign/{signingToken} instead of /sign/{eventId}
```

### Pattern 5: Device Fingerprinting Rate Limiting
**What:** Track submission rate by browser fingerprint (not IP) to detect mass automation
**When to use:** Public signature submission, participant creation
**Example:**
```typescript
// Source: FingerprintJS GitHub + custom rate limit logic
// Client-side (in public signing page):
import FingerprintJS from '@fingerprintjs/fingerprintjs'

const fpPromise = FingerprintJS.load()
const fp = await fpPromise
const result = await fp.get()
const visitorId = result.visitorId // Stable across page reloads, incognito

// Include in API request:
fetch('/api/signatures', {
  body: JSON.stringify({
    ...signatureData,
    deviceFingerprint: visitorId
  })
})

// Server-side (lib/security/rateLimit.ts):
interface RateLimitEntry {
  count: number
  firstSeen: number // timestamp
  windowMs: number // e.g., 60000 (1 minute)
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export function checkRateLimit(
  fingerprint: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): { allowed: boolean; shouldChallenge: boolean } {
  const now = Date.now()
  const entry = rateLimitStore.get(fingerprint)

  if (!entry || now - entry.firstSeen > windowMs) {
    // New window
    rateLimitStore.set(fingerprint, { count: 1, firstSeen: now, windowMs })
    return { allowed: true, shouldChallenge: false }
  }

  entry.count++

  if (entry.count > maxRequests * 2) {
    // Hard block (10+ submissions/min)
    return { allowed: false, shouldChallenge: false }
  }

  if (entry.count > maxRequests) {
    // Soft threshold (5+ submissions/min) — trigger CAPTCHA
    return { allowed: true, shouldChallenge: true }
  }

  return { allowed: true, shouldChallenge: false }
}

// Cleanup job (prevent memory leak in long-running process):
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.firstSeen > entry.windowMs * 2) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Cleanup every minute
```

**Note:** In-memory store works for single Vercel serverless instance. If horizontal scaling needed, use Redis (rate-limit-redis package) for shared state.

### Pattern 6: Dynamic CAPTCHA (Cloudflare Turnstile)
**What:** Invisible/managed CAPTCHA that only triggers on suspicious behavior
**When to use:** When rate limiter returns `shouldChallenge: true`
**Example:**
```typescript
// Source: Cloudflare Turnstile docs (from search results)
// Client-side (React component):
import { useEffect, useState } from 'react'

export function SignatureForm() {
  const [needsCaptcha, setNeedsCaptcha] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  useEffect(() => {
    if (needsCaptcha) {
      // Load Turnstile widget
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }
  }, [needsCaptcha])

  const handleSubmit = async (data) => {
    const response = await fetch('/api/signatures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        deviceFingerprint: await getFingerprint(),
        captchaToken: captchaToken,
      })
    })

    if (response.status === 429) {
      // Server requests CAPTCHA
      setNeedsCaptcha(true)
      return
    }

    // Success
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Signature form fields */}

      {needsCaptcha && (
        <div
          className="cf-turnstile"
          data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          data-callback="onTurnstileSuccess"
        />
      )}
    </form>
  )
}

// Server-side verification (lib/security/captcha.ts):
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    }
  )

  const data = await response.json()
  return data.success === true
}

// In signature creation endpoint:
if (shouldChallenge && !captchaToken) {
  return new Response(JSON.stringify({ error: 'CAPTCHA required' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json' }
  })
}

if (captchaToken && !await verifyTurnstileToken(captchaToken)) {
  return new Response(JSON.stringify({ error: 'Invalid CAPTCHA' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

### Pattern 7: HTML Sanitization Hook
**What:** Strip HTML/script tags from text inputs before storage
**When to use:** beforeChange hook on Participants collection (names, city, professionalNumber)
**Example:**
```typescript
// Source: isomorphic-dompurify npm docs
import DOMPurify from 'isomorphic-dompurify'

// lib/security/sanitize.ts
export function sanitizeText(input: string): string {
  // Strip all HTML tags, keep only text content
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],        // No HTML tags allowed
    KEEP_CONTENT: true,      // Keep text content
    ALLOW_DATA_ATTR: false,  // No data-* attributes
  })
}

// hooks/sanitization/sanitizeText.ts
export const sanitizeParticipantInput = ({ data }) => {
  const fieldsToSanitize = [
    'firstName',
    'lastName',
    'city',
    'professionalNumber',
    'beneficiaryTypeOther'
  ]

  for (const field of fieldsToSanitize) {
    if (data[field] && typeof data[field] === 'string') {
      data[field] = sanitizeText(data[field])
    }
  }

  return data
}

// Apply in Participants.ts:
hooks: {
  beforeChange: [sanitizeParticipantInput]
}
```

### Pattern 8: Sharp Image Re-encoding
**What:** Re-encode signature images through Sharp to strip metadata and destroy polyglot attacks
**When to use:** afterRead hook on Media upload (before storage)
**Example:**
```typescript
// Source: Sharp official docs (default metadata stripping behavior)
import sharp from 'sharp'
import { fileTypeFromBuffer } from 'file-type'

// lib/security/validators.ts
export async function validateImageMagicBytes(
  buffer: Buffer
): Promise<{ valid: boolean; detectedType: string | null }> {
  const fileType = await fileTypeFromBuffer(buffer)

  if (!fileType) {
    return { valid: false, detectedType: null }
  }

  // Only allow PNG and JPEG
  if (!['image/png', 'image/jpeg'].includes(fileType.mime)) {
    return { valid: false, detectedType: fileType.mime }
  }

  return { valid: true, detectedType: fileType.mime }
}

// hooks/uploads/reEncodeImage.ts
export const reEncodeSignatureImage = async ({ req, data }) => {
  // This hook runs BEFORE Vercel Blob upload
  // Access uploaded file from req

  if (!data.file) return data

  const buffer = data.file // Assuming file is Buffer (check Payload upload API)

  // Step 1: Validate magic bytes
  const validation = await validateImageMagicBytes(buffer)
  if (!validation.valid) {
    throw new Error(
      `Type de fichier non autorise. Seuls PNG et JPEG sont acceptes.`
    )
  }

  // Step 2: Validate file size (2MB max)
  if (buffer.length > 2 * 1024 * 1024) {
    throw new Error('La taille du fichier ne doit pas depasser 2 Mo')
  }

  // Step 3: Re-encode through Sharp
  // - Strips ALL metadata (EXIF, location, etc.) by default
  // - Destroys polyglot file attacks (re-encoding parses as image, drops non-image data)
  // - Validates actual image content (Sharp errors if malformed)

  try {
    const reEncodedBuffer = await sharp(buffer)
      .png({ quality: 90, compressionLevel: 9 }) // Force PNG output
      // Alternative: .jpeg({ quality: 90 }) for JPEG
      .toBuffer()

    // Replace original buffer with re-encoded version
    data.file = reEncodedBuffer

    return data
  } catch (error) {
    throw new Error('Fichier image invalide ou corrompu')
  }
}

// Apply in Media.ts:
hooks: {
  beforeChange: [reEncodeSignatureImage]
}
```

**Note:** Forcing PNG output normalizes format (simplifies handling). Could preserve original format by detecting with `validation.detectedType`.

### Pattern 9: Next.js Security Headers Middleware
**What:** Add HTTP security headers via Next.js 15 middleware
**When to use:** Always — defense against clickjacking, XSS, MITM
**Example:**
```typescript
// Source: Next.js docs + search results
// middleware.ts (root of src/)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Content Security Policy
  // - Blocks inline scripts (XSS protection)
  // - Only allow resources from same origin
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Payload admin needs unsafe-eval
    "style-src 'self' 'unsafe-inline'", // Tailwind needs unsafe-inline
    "img-src 'self' data: blob: *.public.blob.vercel-storage.com",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'", // Prevent iframe embedding (same as X-Frame-Options DENY)
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  // Strict-Transport-Security (HSTS)
  // - Force HTTPS for 2 years (63072000 seconds)
  // - Include all subdomains
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  )

  // X-Frame-Options (defense-in-depth with CSP frame-ancestors)
  response.headers.set('X-Frame-Options', 'DENY')

  // X-Content-Type-Options
  // - Prevent MIME sniffing (force declared Content-Type)
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer-Policy
  // - Don't leak full URL in Referer header
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy (formerly Feature-Policy)
  // - Disable unnecessary browser features
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  return response
}

export const config = {
  matcher: [
    // Apply to all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

**IMPORTANT:** `unsafe-inline` and `unsafe-eval` in CSP weaken XSS protection but are required for Payload admin panel and Tailwind CSS. Consider nonce-based CSP for stricter policy (advanced, requires coordination with Payload).

### Pattern 10: CSRF Protection via @edge-csrf/nextjs
**What:** Per-session CSRF token for public API endpoints
**When to use:** All POST/PUT/DELETE requests from public signing page
**Example:**
```typescript
// Source: @edge-csrf/nextjs npm docs
// middleware.ts (add to existing middleware)
import { createCsrfProtect } from '@edge-csrf/nextjs'

const csrfProtect = createCsrfProtect({
  cookie: {
    secure: true,
    sameSite: 'strict',
    httpOnly: true,
    name: '__Host-c-sign.csrf-token',
  },
  // Exclude Payload admin routes (they have own auth)
  excludePathPrefixes: ['/admin', '/api/payload'],
})

export async function middleware(request: NextRequest) {
  // CSRF protection
  const csrfError = await csrfProtect(request)
  if (csrfError) {
    return new NextResponse('Invalid CSRF token', { status: 403 })
  }

  // Security headers (from Pattern 9)
  const response = NextResponse.next()
  // ... add headers ...

  return response
}

// Client-side (lib/api-fetch.ts enhancement):
// The library automatically injects CSRF token in cookie
// Frontend reads it and includes in X-CSRF-Token header
export async function apiFetch(url: string, options: RequestInit = {}) {
  const csrfToken = getCsrfTokenFromCookie()

  const headers = new Headers(options.headers)
  if (csrfToken && ['POST', 'PUT', 'DELETE'].includes(options.method || 'GET')) {
    headers.set('X-CSRF-Token', csrfToken)
  }

  return fetch(url, { ...options, headers })
}

function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)__Host-c-sign\.csrf-token=([^;]+)/)
  return match ? match[1] : null
}
```

### Pattern 11: CORS Configuration
**What:** Restrict API to same-origin + production domain only
**When to use:** Production deployment
**Example:**
```typescript
// Source: Next.js CORS search results
// No custom CORS needed — Next.js API routes are same-origin by default
// To explicitly enforce:

// In API route handlers (if needed):
export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL, // Production URL
    'http://localhost:3000',          // Development
  ]

  if (origin && !allowedOrigins.includes(origin)) {
    return new Response('CORS not allowed', { status: 403 })
  }

  // ... handle request ...
}

// Alternative: Set CORS headers explicitly in middleware (if needed)
// But Next.js default (no CORS headers = same-origin only) is correct for this app
```

**Recommendation:** Rely on Next.js default same-origin policy. Only add explicit CORS headers if cross-origin requests needed (they're not per user requirements).

### Anti-Patterns to Avoid

- **Trusting client-side validation only**: Always validate/sanitize server-side. Client JS is trivially bypassed.
- **IP-based rate limiting for shared WiFi scenarios**: User explicitly requires device fingerprinting because attendees share WiFi in event rooms.
- **Storing CAPTCHA tokens client-side**: Server must verify with Turnstile API — never trust client-submitted "verification".
- **Using Math.random() for tokens**: Not cryptographically secure. Always use crypto.randomBytes or nanoid.
- **Relying on file extensions for upload validation**: Check magic bytes. Extensions are trivially spoofed.
- **Allowing unguessable tokens to remain valid after event finalization**: Token validity must be tied to event lifecycle (open/reopened only).
- **Self-service account unlock**: User decision is admin-only unlock (small known user base, enterprise model).
- **Setting SameSite=None on auth cookies**: User decision is SameSite=Strict (no cross-site requests, stricter CSRF protection).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSRF token generation/validation | Custom token signing/verification logic | @edge-csrf/nextjs | CSRF attacks have subtle edge cases (token binding, double-submit cookies, timing attacks). Vetted library = peer-reviewed defense. |
| Device fingerprinting | Canvas fingerprint + navigator properties collector | FingerprintJS | Fingerprinting requires dozens of signals (WebGL, audio context, fonts, timezone, screen, plugins). Library combines + hashes robustly. Missing signals = easy bypass. |
| HTML sanitization | Regex-based tag stripping | DOMPurify (via isomorphic-dompurify) | XSS payloads use encoding tricks (`&lt;script&gt;`, `<scr<script>ipt>`, attribute injection). DOMPurify parses as DOM, handles all edge cases. Regex = guaranteed bypass. |
| Password hashing | Custom bcrypt/scrypt wrapper | Payload's built-in auth | Payload handles salt generation, cost factor, timing attack resistance. Custom implementation risks bcrypt misuse (wrong cost, deterministic salt). |
| CAPTCHA challenge generation | Custom image/audio puzzles | Cloudflare Turnstile | Accessibility (WCAG compliance), bot resistance (rotating challenges), privacy compliance (GDPR). Building CAPTCHA = months of work, guaranteed bypass by commercial bot services. |
| Rate limiting with Redis | Custom Redis INCR/EXPIRE logic | rate-limit-redis (if Redis used) | Race conditions (atomic INCR+EXPIRE), sliding window algorithms, distributed lock coordination. Custom code = subtle bugs under load. |
| Secure random strings | Math.random() + string manipulation | nanoid / crypto.randomBytes | crypto.random uses OS entropy source (/dev/urandom, CryptoGenRandom). Math.random is **predictable** — seedable PRNG, not cryptographically secure. Predictable tokens = broken security. |
| Magic byte validation | Manual hex comparison | file-type package | 500+ file formats, each with multiple valid signatures (JPEG alone has 3+ variants). Package maintains signature database, handles edge cases. |

**Key insight:** Security primitives (CSRF, sanitization, CAPTCHA) have **decades** of attack research. Using vetted libraries = benefit from hundreds of fixed vulnerabilities. Custom implementations repeat known mistakes.

## Common Pitfalls

### Pitfall 1: In-Memory Rate Limit Store Memory Leak
**What goes wrong:** Map-based rate limit store grows unbounded in long-running serverless functions (Vercel Lambda keeps instances warm for reuse)
**Why it happens:** Each fingerprint creates a Map entry. Without cleanup, memory grows indefinitely (300 requests = 300 entries = eventual OOM crash)
**How to avoid:** Implement cleanup job (setInterval) that deletes expired entries (see Pattern 5 example). Alternative: Use Redis for persistent store with TTL.
**Warning signs:** Lambda memory usage creeping up over hours/days, eventual 502 errors, cold starts becoming more frequent (instance recycling due to memory pressure)

### Pitfall 2: Cloudflare Turnstile Site Key Exposure
**What goes wrong:** Treating NEXT_PUBLIC_TURNSTILE_SITE_KEY as secret
**Why it happens:** "Site key" sounds sensitive, developer doesn't expose it publicly
**How to avoid:** Site key is **meant** to be public (client-side widget requires it). Secret key (TURNSTILE_SECRET_KEY) is private, never exposed. Check docs: site key = public, secret key = server-only.
**Warning signs:** CAPTCHA widget fails to load, browser console shows "Invalid site key" (because env var not available client-side)

### Pitfall 3: Sharp Re-encoding Breaking Payload Upload Flow
**What goes wrong:** beforeChange hook modifies data.file incorrectly, Payload/Vercel Blob fails to upload
**Why it happens:** Payload upload hooks receive file in specific format (Buffer vs ReadStream vs File object). Replacing incorrectly breaks upload pipeline.
**How to avoid:** Read Payload 3.x upload documentation carefully. Test hook with console.log to understand data structure. May need afterRead hook instead of beforeChange, or modify upload config rather than data.file.
**Warning signs:** Uploads fail with cryptic "Invalid file" errors, Vercel Blob shows 0-byte files, uploads work without hook but fail with hook

### Pitfall 4: isomorphic-dompurify Memory Leak in Long-Running Node.js
**What goes wrong:** jsdom window accumulates DOM state across sanitization calls, progressive memory growth
**Why it happens:** isomorphic-dompurify creates fake DOM (jsdom) for server-side use. Each sanitize() call mutates shared window object. In long-running process (Vercel Lambda warm instances), state accumulates.
**How to avoid:** Call `clearWindow()` periodically (e.g., every 100 sanitizations, or in cleanup job). See isomorphic-dompurify docs: "In long-running Node.js processes...clearWindow() to release resources."
**Warning signs:** Server-side sanitization gets slower over time, memory usage grows, eventual OOM crash

### Pitfall 5: FingerprintJS Accuracy Expectations
**What goes wrong:** Expecting 99%+ device identification accuracy, treating fingerprints as unique user IDs
**Why it happens:** Confusing open-source FingerprintJS (40-60% accuracy) with Fingerprint Pro (99.5% accuracy)
**How to avoid:** Use fingerprints for **abuse detection**, not **user identification**. Expect collisions (multiple users same fingerprint) and instability (same user different fingerprints after browser update). Design rate limiting to tolerate false positives (CAPTCHA challenge, not hard block).
**Warning signs:** Users complain about CAPTCHA appearing when they shouldn't be rate-limited (fingerprint collision), attackers bypass rate limit easily (fingerprint instability)

### Pitfall 6: JWT Token Expiry vs Cookie Expiry Mismatch
**What goes wrong:** Setting 24h token expiry but forgetting cookie maxAge, or vice versa — session expires at wrong time
**Why it happens:** Payload has both `tokenExpiration` (JWT expiry) and `cookies.maxAge` (cookie expiry). If mismatched, cookie outlives token (user stays "logged in" but requests fail) or token outlives cookie (server-side session valid but client has no cookie).
**How to avoid:** Set both to same value: `tokenExpiration: 86400` (24h in seconds) AND `cookies.maxAge: 86400` (if maxAge option exists — check Payload docs).
**Warning signs:** Users complain about being "logged out" before 24h (cookie expired early), or requests fail with "Invalid token" while appearing logged in (token expired, cookie still present)

### Pitfall 7: Admin-Only Unlock Not Configured
**What goes wrong:** Setting `lockTime: 600` (10-minute auto-unlock) instead of `lockTime: 0` (indefinite lock)
**Why it happens:** Misreading docs or assuming 0 is "no lockout" (it's actually "infinite lockout")
**How to avoid:** Verify behavior: `lockTime: 0` = never auto-unlock (admin must manually unlock via Payload operation). Test by triggering 5 failed logins, verify account doesn't auto-unlock after waiting.
**Warning signs:** Locked accounts become usable again after waiting (auto-unlock kicking in)

### Pitfall 8: Allowing Organizers to Access Payload Admin Panel
**What goes wrong:** Current code allows organizer role to access /admin, violates user requirement (admin-only)
**Why it happens:** Early implementation needed organizers to manage content via admin UI, requirement changed to frontend-only for organizers
**How to avoid:** Change Users collection access.admin to `({ req: { user } }) => user?.role === 'admin'` (remove `|| user?.role === 'organizer'`)
**Warning signs:** Organizers can access /admin/collections (full database access, can modify other organizers' events, bypass frontend business logic)

## Code Examples

Verified patterns from official sources and search results:

### Payload Auth Configuration
```typescript
// Source: Payload CMS docs (inferred from search results)
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 86400, // 24 hours (seconds)
    maxLoginAttempts: 5,
    lockTime: 0, // Indefinite lock (admin-only unlock)
    forgotPassword: false,
    verify: false,
    cookies: {
      secure: true,
      sameSite: 'Strict',
    },
  },
  access: {
    create: isAdmin,
    admin: ({ req: { user } }) => user?.role === 'admin', // Admin-only panel access
  },
  hooks: {
    beforeChange: [validatePassword],
  },
}
```

### Unguessable Token Generation
```typescript
// Source: nanoid GitHub
import { nanoid } from 'nanoid'

export function generateSigningToken(): string {
  return nanoid() // 21 chars, ~126 bits entropy, URL-safe
}
```

### Device Fingerprint Collection
```typescript
// Source: FingerprintJS docs
import FingerprintJS from '@fingerprintjs/fingerprintjs'

const fpPromise = FingerprintJS.load()

async function getFingerprint(): Promise<string> {
  const fp = await fpPromise
  const result = await fp.get()
  return result.visitorId
}
```

### Cloudflare Turnstile Verification
```typescript
// Source: Cloudflare Turnstile docs (search results)
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    }
  )

  const data = await response.json()
  return data.success === true
}
```

### HTML Sanitization
```typescript
// Source: isomorphic-dompurify npm
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  })
}
```

### Magic Byte Validation
```typescript
// Source: file-type npm
import { fileTypeFromBuffer } from 'file-type'

export async function validateImageMagicBytes(buffer: Buffer) {
  const fileType = await fileTypeFromBuffer(buffer)

  if (!fileType || !['image/png', 'image/jpeg'].includes(fileType.mime)) {
    throw new Error('Type de fichier non autorise')
  }

  return fileType.mime
}
```

### Sharp Image Re-encoding
```typescript
// Source: Sharp docs (official)
import sharp from 'sharp'

export async function reEncodeImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .png({ quality: 90, compressionLevel: 9 })
    .toBuffer()
  // Metadata stripped by default, polyglot payloads destroyed
}
```

### Password Validation Schema
```typescript
// Source: Multiple regex resources (search results)
import { z } from 'zod'

export const passwordSchema = z.string()
  .min(8, 'Minimum 8 caracteres')
  .regex(/(?=.*[a-z])/, 'Au moins une minuscule')
  .regex(/(?=.*[A-Z])/, 'Au moins une majuscule')
  .regex(/(?=.*\d)/, 'Au moins un chiffre')
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| reCAPTCHA v2 (checkbox) | Cloudflare Turnstile (invisible/managed) | 2022-2023 | Privacy-first (no Google tracking), GDPR/CCPA compliant, rotating JS challenges harder to bypass |
| IP-based rate limiting | Device fingerprinting | Ongoing | Effective in shared WiFi scenarios (conferences, offices), resistant to VPN/proxy rotation |
| UUID v4 for tokens | Nanoid | 2018-present | Shorter URLs (21 vs 36 chars), same entropy (~126 vs ~122 bits), URL-safe by default |
| bcrypt custom wrappers | Framework built-in auth (Payload) | CMS-dependent | Eliminates custom crypto code risks (salt generation, cost factor, timing attacks) |
| Regex-based HTML sanitization | DOMPurify parsing | 2014-present | Handles encoding tricks, nested tags, attribute injection — regex cannot parse HTML correctly |
| Static CSRF tokens | Per-session CSRF tokens | Security best practice | Session binding prevents token fixation, rotation on logout prevents reuse |
| Manual EXIF stripping (exiftool) | Sharp default metadata removal | Sharp 0.20+ (2019) | Image re-encoding destroys polyglot attacks, not just metadata strip |
| File extension validation | Magic byte validation | Longstanding best practice | Extensions trivially spoofed (rename .exe to .jpg) — magic bytes verify actual file structure |

**Deprecated/outdated:**
- **reCAPTCHA v2**: Google tracking concerns, privacy regulations favor alternatives
- **Math.random() for security tokens**: Never cryptographically secure, modern browsers provide crypto.getRandomValues / Node crypto.randomBytes
- **IP-based rate limiting only**: Ineffective against botnets (distributed IPs), blocks legitimate users on shared IPs (CGNAT, corporate proxies)
- **Per-request CSRF tokens in SPAs**: Session-based tokens simpler for React apps (no token refresh dance)
- **Storing passwords in plaintext**: Illegal in many jurisdictions (GDPR, CCPA), violates all security standards — use framework auth (Payload bcrypt)

## Open Questions

### Question 1: Payload Upload Hook API for Sharp Re-encoding
**What we know:** Payload 3.x has upload hooks (beforeChange, afterRead), Sharp re-encoding needs to modify file buffer before storage
**What's unclear:** Exact structure of `data` object in upload hooks (is file a Buffer, ReadStream, or File object?), whether beforeChange or different hook point is correct for modifying pre-upload
**Recommendation:** Review Payload 3.x upload documentation during implementation. Test hook with small file, console.log data structure. May need to use `upload.handlers` config instead of collection hooks.

### Question 2: Redis Requirement for Horizontal Scaling
**What we know:** In-memory rate limit store works for single serverless instance (Vercel default), Redis needed if multiple instances share state
**What's unclear:** Whether Vercel deployment will use single Lambda or multiple (depends on traffic, Vercel tier), acceptable cost of Redis for MVP
**Recommendation:** Start with in-memory store (simpler, no Redis cost). Monitor Vercel logs for multiple instance IDs. Add Redis (Vercel KV or Upstash) only if rate limits bypass observed across instances.

### Question 3: CSP Compatibility with Payload Admin Panel
**What we know:** Payload admin uses React, may require `unsafe-inline` and `unsafe-eval` in CSP, strict CSP can break admin UI
**What's unclear:** Exact CSP directives Payload 3.x tolerates, whether nonce-based CSP feasible (requires Payload cooperation)
**Recommendation:** Start with permissive CSP for /admin routes (unsafe-inline, unsafe-eval allowed), strict CSP for public routes (/sign/*). Test admin panel functionality. Explore nonce-based CSP in future phase if strict policy required.

### Question 4: FingerprintJS Stability Across Browser Updates
**What we know:** Open-source FingerprintJS has 40-60% accuracy, browser updates (Chrome, Safari) reduce entropy (privacy features)
**What's unclear:** How often fingerprints change for same user (stability), acceptable rate of false positives (legitimate users challenged with CAPTCHA)
**Recommendation:** Log fingerprint changes for same email (if user creates account) to measure stability. Set rate limit threshold conservatively (10 requests/min before CAPTCHA, 20 before hard block) to tolerate instability. Monitor CAPTCHA challenge rate, adjust threshold based on user complaints.

### Question 5: Unlocking Users via Payload Admin vs Custom Endpoint
**What we know:** Payload provides unlock operation (REST, GraphQL, Local API), user requirement is admin-only unlock
**What's unclear:** Whether Payload admin UI exposes unlock button for locked users, or if custom admin action needed
**Recommendation:** Test account lockout flow in Payload admin (trigger 5 failed logins, check if admin sees "Unlock User" button). If not available, create custom admin component (Payload allows custom UI) or Local API script for admins.

### Question 6: Token Regeneration Impact on Active Signing Sessions
**What we know:** Organizer can regenerate signing token to invalidate old QR code (if link leaked)
**What's unclear:** Whether in-progress signing sessions (user loaded /sign/{oldToken} before regeneration) should be forcibly invalidated or allowed to complete
**Recommendation:** Graceful handling — allow in-progress sessions to complete (don't break mid-signature), but block new page loads after regeneration. Store token generation timestamp, check in signing page load (not per-signature-submit).

## Sources

### Primary (HIGH confidence)
- [Payload CMS Authentication Overview](https://payloadcms.com/docs/authentication/overview) - Auth configuration options
- [Payload CMS Preventing Production API Abuse](https://payloadcms.com/docs/production/preventing-abuse) - Built-in abuse prevention features
- [Payload CMS GraphQL Overview](https://payloadcms.com/docs/graphql/overview) - Production GraphQL playground configuration
- [Payload CMS Access Control](https://payloadcms.com/docs/access-control/overview) - Admin panel access control
- [Payload CMS Cookie Strategy](https://payloadcms.com/docs/authentication/cookies) - Cookie security configuration
- [Cloudflare Turnstile](https://www.cloudflare.com/application-services/products/turnstile/) - CAPTCHA alternative overview
- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/) - Implementation details
- [FingerprintJS GitHub](https://github.com/fingerprintjs/fingerprintjs) - Open-source browser fingerprinting
- [DOMPurify GitHub](https://github.com/cure53/DOMPurify) - XSS sanitizer library
- [isomorphic-dompurify npm](https://www.npmjs.com/package/isomorphic-dompurify) - Server-side DOMPurify wrapper
- [Nanoid GitHub](https://github.com/ai/nanoid) - Secure random ID generation
- [Sharp Output Options](https://sharp.pixelplumbing.com/api-output/) - Image format conversion
- [Sharp Input Metadata](https://sharp.pixelplumbing.com/api-input/) - Metadata handling
- [file-type npm](https://www.npmjs.com/package/file-type) - Magic byte validation (inferred from search results)
- [@edge-csrf/nextjs npm](https://www.npmjs.com/package/@edge-csrf/nextjs) - CSRF protection for Next.js (inferred)

### Secondary (MEDIUM confidence)
- [Next.js Content Security Policy Guide](https://nextjs.org/docs/pages/guides/content-security-policy) - CSP implementation patterns
- [Next.js Security Headers](https://nextjs.org/docs/pages/api-reference/config/next-config-js/headers) - Header configuration
- [Adding Security Headers to Next.js](https://alvinwanjala.com/blog/adding-security-headers-nextjs/) - Practical implementation
- [Implementing CSRF Protection in Next.js](https://medium.com/@mmalishshrestha/implementing-csrf-protection-in-next-js-applications-9a29d137a12d) - CSRF patterns
- [Using CORS in Next.js](https://blog.logrocket.com/using-cors-next-js-handle-cross-origin-requests/) - CORS configuration
- [Redis Rate Limiting Howto](https://redis.io/learn/howtos/ratelimiting) - Rate limiting algorithms
- [Rate Limiting with Redis and Node.js](https://webdock.io/en/docs/how-guides/javascript-guides/rate-limiting-redis-and-nodejs-under-hood) - Implementation guide
- [Nano ID vs UUID Comparison](https://medium.com/@gaspm/nano-id-popular-secure-and-url-friendly-unique-identifiers-1fa86c9fdf7c) - Entropy analysis
- [Password Validation Regex JavaScript](https://www.geeksforgeeks.org/javascript/javascript-program-to-validate-password-using-regular-expressions/) - Regex patterns
- [File Validation Using Magic Numbers](https://medium.com/@sridhar_be/file-validations-using-magic-numbers-in-nodejs-express-server-d8fbb31a97e7) - Magic byte validation
- [How MetaDefender Prevents Polyglot Attacks](https://www.opswat.com/blog/how-metadefender-prevents-sophisticated-polyglot-image-attacks) - Polyglot file attack overview

### Tertiary (LOW confidence)
- Various GitHub discussions and community help threads for Payload CMS (usage examples, not official docs)
- Stack Overflow and Medium articles (practical patterns, not authoritative sources)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries are well-documented, widely used, versions verified via npm
- Architecture patterns: MEDIUM-HIGH - Payload auth config inferred from docs (not all options explicitly documented for v3), Sharp/DOMPurify patterns verified from official docs, rate limiting/CAPTCHA patterns synthesized from multiple sources
- Pitfalls: MEDIUM - Based on known issues from library docs (isomorphic-dompurify memory leak, FingerprintJS accuracy) and general security best practices, not c-sign-specific testing
- Code examples: HIGH for libraries (Sharp, nanoid, DOMPurify), MEDIUM for Payload (v3 docs less comprehensive than v2), MEDIUM for integration patterns (untested in c-sign codebase)

**Research date:** 2026-02-15
**Valid until:** ~30 days (security landscape stable, but library versions and Payload CMS updates may introduce changes)

**Critical gap:** Payload 3.x upload hook API structure not fully verified — requires testing during implementation to confirm data.file manipulation approach for Sharp re-encoding.
