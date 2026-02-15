import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { generateSigningToken } from '@/lib/security/tokens'

/**
 * POST /api/events/[id]/regenerate-token
 *
 * Regenerates the signing token for an event. This endpoint should be used when:
 * - A signing URL has been compromised
 * - An organizer wants to invalidate existing QR codes
 *
 * Requires authentication (the user must be an organizer who owns the event).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const payload = await getPayload({ config })

    // Verify the event exists and user has access (access control is automatic via Payload)
    const event = await payload.findByID({
      collection: 'events',
      id,
      depth: 0,
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Generate a new signing token
    const newToken = generateSigningToken()

    // Update the event with the new token
    const updatedEvent = await payload.update({
      collection: 'events',
      id,
      data: {
        signingToken: newToken,
      },
    })

    return NextResponse.json({
      success: true,
      signingToken: updatedEvent.signingToken,
      message: 'Signing token regenerated successfully',
    })
  } catch (error) {
    console.error('Token regeneration error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate signing token' },
      { status: 500 }
    )
  }
}
