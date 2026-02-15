import { nanoid } from 'nanoid'

/**
 * Generates a cryptographically secure signing token for event URLs.
 *
 * Uses nanoid with default alphabet (A-Za-z0-9_-) and 21 characters,
 * providing ~126 bits of entropy - sufficient to prevent brute-force enumeration.
 *
 * @returns A 21-character URL-safe token
 */
export function generateSigningToken(): string {
  return nanoid()
}
