import { NextRequest } from 'next/server'
import { getPayload } from 'payload'

import { generateEventXLSX } from '@/lib/export/generateXLSX'
import config from '@/payload.config'

/**
 * Manual XLSX download endpoint for finalized events
 * Requires authentication and finalized event status
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params

    // Get Payload instance
    const payload = await getPayload({ config })

    // Authenticate user
    const { user } = await payload.auth({ headers: req.headers })

    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch event with user context for access control
    const event = await payload.findByID({
      collection: 'events',
      id,
      user,
    })

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify event is finalized
    if (event.status !== 'finalized') {
      return new Response(JSON.stringify({ error: 'Event must be finalized before export' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Generate XLSX
    const xlsxBuffer = await generateEventXLSX(payload, id)

    // Build filename
    const titleSlug = event.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `feuille-presence-${titleSlug}-${dateStr}.xlsx`

    // Return XLSX as download
    return new Response(xlsxBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': xlsxBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Export route error:', error)
    return new Response(
      JSON.stringify({
        error: 'Export failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
