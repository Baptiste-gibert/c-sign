import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Generate a random CSRF token
 */
function generateCsrfToken(): string {
  // Generate a random token using crypto (available in Edge runtime)
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Next.js middleware for security headers and CSRF protection
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl

  // Skip CSRF protection for Payload admin routes
  const isPayloadAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/users')

  // CSRF Protection (double-submit cookie pattern)
  if (!isPayloadAdminRoute) {
    const method = request.method.toUpperCase()

    if (method === 'GET' || method === 'HEAD') {
      // On safe methods: generate token if missing
      const existingToken = request.cookies.get('_csrf')?.value
      if (!existingToken) {
        const token = generateCsrfToken()
        response.cookies.set('_csrf', token, {
          httpOnly: false, // JavaScript needs to read it
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
        })
      }
    } else if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      // On state-changing methods: validate token
      const cookieToken = request.cookies.get('_csrf')?.value
      const headerToken = request.headers.get('x-csrf-token')

      if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
      }
    }
  }

  // Security Headers
  const headers = response.headers

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: *.public.blob.vercel-storage.com",
    "font-src 'self' data:",
    "connect-src 'self' https://challenges.cloudflare.com",
    'frame-src https://challenges.cloudflare.com',
    "frame-ancestors 'none'",
  ]
  headers.set('Content-Security-Policy', cspDirectives.join('; '))

  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  // Clickjacking protection
  headers.set('X-Frame-Options', 'DENY')

  // MIME sniffing protection
  headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
