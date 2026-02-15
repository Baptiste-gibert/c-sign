import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const eventId = searchParams.get('eventId')
  const dayId = searchParams.get('dayId')

  // Support both new token-based flow (eventId) and legacy dayId-only flow
  if (!eventId && !dayId) {
    return NextResponse.json(
      { error: 'eventId or dayId query parameter is required' },
      { status: 400 }
    )
  }

  // Construct the public signing URL
  // In production, this would be the public frontend URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  let signUrl: string
  let signingToken: string | undefined

  try {
    // New token-based flow: look up event by eventId
    if (eventId) {
      const payload = await getPayload({ config })

      const event = await payload.findByID({
        collection: 'events',
        id: eventId,
        depth: 0,
      })

      if (!event) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        )
      }

      if (!event.signingToken) {
        return NextResponse.json(
          { error: 'Event has no signing token. This event was created before token system was implemented.' },
          { status: 400 }
        )
      }

      signingToken = event.signingToken

      // Include dayId as query param if provided (for backward compatibility during migration)
      signUrl = dayId
        ? `${baseUrl}/sign/${signingToken}?day=${dayId}`
        : `${baseUrl}/sign/${signingToken}`
    }
    // Legacy flow: use dayId directly (for backward compatibility)
    else {
      signUrl = `${baseUrl}/sign/${dayId}`
    }
  } catch (error) {
    console.error('QR code URL generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate signing URL' },
      { status: 500 }
    )
  }

  // Generate QR code as data URL (base64 PNG)
  try {
    const qrDataUrl = await QRCode.toDataURL(signUrl, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    return NextResponse.json({
      qrDataUrl,
      signUrl,
      signingToken,
      dayId,
    })
  } catch (error) {
    console.error('QR code generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}
