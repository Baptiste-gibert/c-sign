import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { seed } from '@/seed'

export async function GET() {
  try {
    // Only allow seeding in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Seeding is disabled in production' }, { status: 403 })
    }

    const payload = await getPayload({ config })
    await seed(payload)

    return NextResponse.json({ success: true, message: 'Seed completed successfully' })
  } catch (error) {
    console.error('Seed failed:', error)
    return NextResponse.json(
      { error: 'Seed failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
