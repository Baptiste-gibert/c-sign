interface RateLimitEntry {
  count: number
  firstSeen: number
}

interface RateLimitResult {
  allowed: boolean
  shouldChallenge: boolean
}

const store = new Map<string, RateLimitEntry>()

/**
 * Check rate limit for a device fingerprint
 * @param fingerprint Device fingerprint from FingerprintJS
 * @param maxRequests Maximum requests allowed in window (default: 10)
 * @param windowMs Time window in milliseconds (default: 60000 = 1 minute)
 * @returns Object indicating if request is allowed and if CAPTCHA should be triggered
 */
export function checkRateLimit(
  fingerprint: string,
  maxRequests: number = 10,
  windowMs: number = 60000,
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(fingerprint)

  // If no entry or window expired, create new entry
  if (!entry || now - entry.firstSeen > windowMs) {
    store.set(fingerprint, { count: 1, firstSeen: now })
    return { allowed: true, shouldChallenge: false }
  }

  // Increment count
  entry.count++

  // Within normal limit: allow without CAPTCHA
  if (entry.count <= maxRequests) {
    return { allowed: true, shouldChallenge: false }
  }

  // Exceeded normal limit but within 2x: trigger CAPTCHA challenge
  if (entry.count <= maxRequests * 2) {
    return { allowed: true, shouldChallenge: true }
  }

  // Exceeded 2x limit: hard block
  return { allowed: false, shouldChallenge: false }
}

/**
 * Clean up old entries from the rate limit store
 * Called periodically to prevent memory leaks
 */
function cleanupStore(windowMs: number = 60000) {
  const now = Date.now()
  const threshold = windowMs * 2

  for (const [fingerprint, entry] of store.entries()) {
    if (now - entry.firstSeen > threshold) {
      store.delete(fingerprint)
    }
  }
}

/**
 * Reset the rate limit store (for testing)
 */
export function resetRateLimitStore() {
  store.clear()
}

// Start cleanup interval (every 60 seconds)
if (typeof setInterval !== 'undefined') {
  setInterval(() => cleanupStore(), 60000)
}
