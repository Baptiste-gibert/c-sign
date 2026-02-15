/**
 * Verify a Cloudflare Turnstile CAPTCHA token server-side
 * @param token The Turnstile response token from the client
 * @returns True if verification succeeds, false otherwise
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY

  // Graceful fallback when CAPTCHA not configured (dev environment)
  if (!secret) {
    console.warn('TURNSTILE_SECRET_KEY not configured — skipping CAPTCHA verification')
    return true
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    })

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('Turnstile verification failed:', error)
    return false
  }
}
