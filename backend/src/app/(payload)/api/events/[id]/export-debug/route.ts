import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * Debug endpoint — inspect image URLs and fetch results for XLSX export
 * DELETE THIS after debugging
 */

function getBlobBaseUrl(): string | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return null
  const match = token.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)
  if (!match) return null
  return `https://${match[1].toLowerCase()}.public.blob.vercel-storage.com`
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return Response.json({ error: 'auth required' }, { status: 401 })

  const blobBaseUrl = getBlobBaseUrl()
  const serverUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000'

  const debug: any = {
    serverUrl,
    blobBaseUrl: blobBaseUrl || '(not available)',
    env: {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '(not set)',
      NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || '(not set)',
      VERCEL_URL: process.env.VERCEL_URL || '(not set)',
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? '(set)' : '(not set)',
    },
    signatures: [],
  }

  const event = await payload.findByID({
    collection: 'events',
    id,
    depth: 3,
    overrideAccess: true,
  })

  const attendanceDays = Array.isArray(event.attendanceDays) ? event.attendanceDays : []

  for (const day of attendanceDays) {
    if (typeof day === 'string' || !day.date) continue

    const sessions = await payload.find({
      collection: 'sessions',
      where: { attendanceDay: { equals: day.id } },
      depth: 0,
      limit: 100,
      overrideAccess: true,
    })

    for (const session of sessions.docs) {
      const sigs = await payload.find({
        collection: 'signatures',
        where: { session: { equals: session.id } },
        depth: 2,
        limit: 10,
        overrideAccess: true,
      })

      for (const sig of sigs.docs) {
        const participant = sig.participant
        const image = sig.image
        const entry: any = {
          participantEmail: typeof participant === 'object' ? participant.email : participant,
          imageField: image === null ? 'null' : typeof image === 'string' ? `id:${image}` : typeof image === 'number' ? `id:${image}` : 'object',
        }

        if (image && typeof image === 'object') {
          entry.imageUrl = image.url || '(no url field)'
          entry.imageFilename = image.filename || '(no filename)'

          // Show both old and new URL resolution
          const oldUrl = image.url?.startsWith('http') ? image.url : `${serverUrl}${image.url}`
          entry.oldResolvedUrl = oldUrl

          const newUrl = image.url?.startsWith('http')
            ? image.url
            : blobBaseUrl
              ? `${blobBaseUrl}/${encodeURIComponent(image.filename)}`
              : `${serverUrl}${image.url}`
          entry.newResolvedUrl = newUrl

          // Try fetching with new URL
          try {
            const res = await fetch(newUrl)
            entry.fetchStatus = res.status
            entry.fetchOk = res.ok
            entry.fetchContentType = res.headers.get('content-type')
            entry.fetchContentLength = res.headers.get('content-length')
          } catch (err: any) {
            entry.fetchError = err.message
          }
        }

        debug.signatures.push(entry)
      }
    }
  }

  return Response.json(debug, { status: 200 })
}
