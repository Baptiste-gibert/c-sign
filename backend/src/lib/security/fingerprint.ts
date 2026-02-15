'use client'
import FingerprintJS from '@fingerprintjs/fingerprintjs'

let fpPromise: ReturnType<typeof FingerprintJS.load> | null = null

/**
 * Get device fingerprint using FingerprintJS
 * Caches the FingerprintJS agent for reuse across calls
 * @returns Promise resolving to unique device fingerprint (visitorId)
 */
export async function getFingerprint(): Promise<string> {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load()
  }
  const fp = await fpPromise
  const result = await fp.get()
  return result.visitorId
}
