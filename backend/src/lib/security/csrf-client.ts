/**
 * Client-side CSRF token utilities
 */

/**
 * Reads the CSRF token from the cookie set by the middleware.
 * The middleware sets a cookie named '_csrf' with httpOnly: false,
 * allowing JavaScript to read it for inclusion in request headers.
 *
 * @returns The CSRF token string, or null if not found or running server-side
 */
export function getCsrfToken(): string | null {
  // Server-side rendering: no document object
  if (typeof document === 'undefined') return null

  // Parse the _csrf cookie value
  const match = document.cookie.match(/(?:^|;\s*)_csrf=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}
