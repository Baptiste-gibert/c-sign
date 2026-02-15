import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/security/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { deviceFingerprint } = body

    // No fingerprint provided: allow without rate limiting
    if (!deviceFingerprint) {
      return NextResponse.json({ allowed: true, shouldChallenge: false })
    }

    // Check rate limit for this device
    const result = checkRateLimit(deviceFingerprint)

    // Hard block if limit exceeded
    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Trop de soumissions. Veuillez réessayer plus tard.' },
        { status: 429 },
      )
    }

    // Return whether CAPTCHA challenge should be shown
    return NextResponse.json(result)
  } catch (error) {
    console.error('Rate check error:', error)
    return NextResponse.json({ error: 'Erreur lors de la vérification' }, { status: 500 })
  }
}
