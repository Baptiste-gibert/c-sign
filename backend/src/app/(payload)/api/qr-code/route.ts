import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const dayId = searchParams.get('dayId')

  if (!dayId) {
    return NextResponse.json(
      { error: 'dayId query parameter is required' },
      { status: 400 }
    )
  }

  // Construct the public signing URL
  // In production, this would be the public frontend URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const signUrl = `${baseUrl}/sign/${dayId}`

  try {
    // Generate QR code as data URL (base64 PNG)
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
