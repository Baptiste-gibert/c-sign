import ExcelJS from 'exceljs'
import type { Payload } from 'payload'

import { optimizeSignature } from './optimizeSignature'

/**
 * Derive the public Vercel Blob base URL from the BLOB_READ_WRITE_TOKEN.
 * Token format: vercel_blob_rw_<storeId>_<random>
 * Blob URL:     https://<storeId>.public.blob.vercel-storage.com
 */
function getBlobBaseUrl(): string | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return null
  const match = token.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)
  if (!match) return null
  return `https://${match[1].toLowerCase()}.public.blob.vercel-storage.com`
}

/**
 * Resolve an image URL to a fetchable absolute URL.
 * - Vercel Blob: construct public Blob URL from filename (bypasses deployment protection)
 * - Absolute URL: use as-is
 * - Relative URL: prefix with server URL
 */
function resolveImageUrl(
  imageUrl: string,
  filename: string,
  blobBaseUrl: string | null,
  serverUrl: string,
): string {
  // If the URL is already absolute, use it directly
  if (imageUrl.startsWith('http')) return imageUrl

  // On Vercel with Blob storage, construct the public Blob URL directly
  // This avoids self-fetching through the deployment (which hits Vercel auth protection)
  if (blobBaseUrl) {
    return `${blobBaseUrl}/${encodeURIComponent(filename)}`
  }

  // Fall back to self-fetch with server URL (works locally)
  return `${serverUrl}${imageUrl}`
}

/**
 * Generate XLSX attendance sheet with embedded signature images
 */
export async function generateEventXLSX(payload: Payload, eventId: string): Promise<Buffer> {
  // Fetch event — overrideAccess since caller already verified auth
  const event = await payload.findByID({
    collection: 'events',
    id: eventId,
    depth: 3,
    overrideAccess: true,
  })

  if (!event) {
    throw new Error(`Event ${eventId} not found`)
  }

  // Create workbook
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'c-sign'
  const worksheet = workbook.addWorksheet('Feuille de Presence')

  // Define columns
  worksheet.columns = [
    { header: 'Nom', key: 'lastName', width: 20 },
    { header: 'Prenom', key: 'firstName', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Ville', key: 'city', width: 20 },
    { header: 'N inscription', key: 'professionalNumber', width: 20 },
    { header: 'Type beneficiaire', key: 'beneficiaryType', width: 20 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Session', key: 'session', width: 20 },
    { header: 'Droit image', key: 'rightToImage', width: 15 },
    { header: 'Signature', key: 'signature', width: 30 },
  ]

  // Add event info header rows
  worksheet.insertRow(1, [`Evenement: ${event.title}`])

  // Build metadata line with optional CNOV number
  let metadataLine = `Lieu: ${event.location} | Organisateur: ${event.organizerName} | Type: ${event.expenseType}`
  if (event.cnovDeclarationNumber) {
    metadataLine += ` | CNOV: ${event.cnovDeclarationNumber}`
  }
  worksheet.insertRow(2, [metadataLine])
  worksheet.insertRow(3, []) // Empty row

  // Style header row (row 4)
  const headerRow = worksheet.getRow(4)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }

  // Track current row number (used to be currentRow = 5, but never reassigned or used)

  // Resolve image URL strategy
  const blobBaseUrl = getBlobBaseUrl()
  const serverUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000'

  // Iterate through attendance days
  const attendanceDays = Array.isArray(event.attendanceDays) ? event.attendanceDays : []

  for (const attendanceDay of attendanceDays) {
    // Check if attendanceDay is populated (object) vs just ID (string)
    if (typeof attendanceDay === 'string' || !attendanceDay.date) {
      continue
    }

    const dateObj = new Date(attendanceDay.date)
    const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`

    // Query sessions directly — attendanceDay.sessions relationship is not
    // auto-populated when sessions are created, so we must query by attendanceDay ID
    const dayId = typeof attendanceDay === 'object' ? attendanceDay.id : attendanceDay
    const sessionsResult = await payload.find({
      collection: 'sessions',
      where: { attendanceDay: { equals: dayId } },
      depth: 0,
      limit: 100,
      overrideAccess: true,
    })

    for (const session of sessionsResult.docs) {
      // Query signatures directly — session.signatures relationship is not
      // auto-populated when signatures are created, so we must query by session ID
      const sessionId = session.id
      const signaturesResult = await payload.find({
        collection: 'signatures',
        where: { session: { equals: sessionId } },
        depth: 2, // Populate participant and image
        limit: 500,
        overrideAccess: true,
      })

      for (const signature of signaturesResult.docs) {
        const participant = signature.participant
        if (!participant || typeof participant === 'string') {
          continue
        }

        // Add data row
        const row = worksheet.addRow({
          lastName: participant.lastName || '',
          firstName: participant.firstName || '',
          email: participant.email || '',
          city: participant.city || '',
          professionalNumber: participant.professionalNumber || '',
          beneficiaryType: participant.beneficiaryType || '',
          date: dateStr,
          session: session.name || '',
          rightToImage: signature.rightToImage ? 'Oui' : 'Non',
          signature: '', // Will be filled with image
        })

        // Set row height for signature image
        row.height = 75

        // Embed signature image
        const image = signature.image
        if (image && typeof image === 'object' && image.url) {
          try {
            const fetchUrl = resolveImageUrl(image.url, image.filename, blobBaseUrl, serverUrl)
            const response = await fetch(fetchUrl)

            if (!response.ok) {
              console.error(
                `Image fetch failed for ${participant.email}: ${response.status} ${response.statusText} (URL: ${fetchUrl})`,
              )
              continue
            }

            const imageBuffer = Buffer.from(await response.arrayBuffer())

            // Try to optimize with sharp; fall back to raw PNG if sharp fails
            let finalBuffer: Buffer
            let extension: 'jpeg' | 'png'
            try {
              finalBuffer = await optimizeSignature(imageBuffer)
              extension = 'jpeg'
            } catch (sharpError) {
              console.warn(
                `Sharp optimization failed for ${participant.email}, using raw PNG:`,
                sharpError,
              )
              finalBuffer = imageBuffer
              extension = 'png'
            }

            // Add image to workbook
            const imageId = workbook.addImage({
              buffer: finalBuffer as never,
              extension,
            })

            // Place image in signature column (column index 9, 0-indexed)
            // ExcelJS uses 0-indexed coordinates for anchors
            worksheet.addImage(imageId, {
              tl: { col: 9, row: row.number - 1 },
              br: { col: 10, row: row.number },
              editAs: 'oneCell',
            } as never)
          } catch (error) {
            console.error(`Failed to embed signature image for ${participant.email}:`, error)
            // Continue without image - don't fail the entire export
          }
        }
      }
    }
  }

  // Add autofilter to header row
  worksheet.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4, column: 10 },
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  const finalBuffer = Buffer.from(buffer)

  // Log file size
  const fileSizeMB = (finalBuffer.length / 1024 / 1024).toFixed(2)
  console.log(`Generated XLSX: ${fileSizeMB} MB`)

  // Warn if file is too large for email
  if (finalBuffer.length > 8 * 1024 * 1024) {
    console.warn(`WARNING: XLSX file size (${fileSizeMB} MB) exceeds 8 MB email attachment limit`)
  }

  return finalBuffer
}
