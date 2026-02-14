import type { Payload } from 'payload'
import ExcelJS from 'exceljs'
import { optimizeSignature } from './optimizeSignature'

/**
 * Generate XLSX attendance sheet with embedded signature images
 */
export async function generateEventXLSX(payload: Payload, eventId: string): Promise<Buffer> {
  // Fetch event with full depth to populate all relationships
  const event = await payload.findByID({
    collection: 'events',
    id: eventId,
    depth: 3,
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
  worksheet.insertRow(2, [`Lieu: ${event.location} | Organisateur: ${event.organizerName} | Type: ${event.expenseType}`])
  worksheet.insertRow(3, []) // Empty row

  // Style header row (row 4)
  const headerRow = worksheet.getRow(4)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  }

  // Track current row number
  let currentRow = 5

  // Get server URL for image fetching
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  // Iterate through attendance days
  const attendanceDays = Array.isArray(event.attendanceDays) ? event.attendanceDays : []

  for (const attendanceDay of attendanceDays) {
    // Check if attendanceDay is populated (object) vs just ID (string)
    if (typeof attendanceDay === 'string' || !attendanceDay.date) {
      continue
    }

    const dateObj = new Date(attendanceDay.date)
    const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`

    const sessions = Array.isArray(attendanceDay.sessions) ? attendanceDay.sessions : []

    for (const session of sessions) {
      if (typeof session === 'string' || !session.name) {
        continue
      }

      // Query signatures directly — session.signatures relationship is not
      // auto-populated when signatures are created, so we must query by session ID
      const sessionId = typeof session === 'object' ? session.id : session
      const signaturesResult = await payload.find({
        collection: 'signatures',
        where: { session: { equals: sessionId } },
        depth: 2, // Populate participant and image
        limit: 500,
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
            // Fetch image
            const imageUrl = image.url.startsWith('http') ? image.url : `${serverUrl}${image.url}`
            const response = await fetch(imageUrl)

            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.statusText}`)
            }

            const imageBuffer = Buffer.from(await response.arrayBuffer())

            // Optimize image
            const optimizedBuffer = await optimizeSignature(imageBuffer)

            // Add image to workbook
            const imageId = workbook.addImage({
              buffer: optimizedBuffer as any,
              extension: 'jpeg',
            })

            // Place image in signature column (column index 9, 0-indexed)
            // ExcelJS uses 0-indexed coordinates for anchors
            worksheet.addImage(imageId, {
              tl: { col: 9, row: row.number - 1 } as any,
              br: { col: 10, row: row.number } as any,
              editAs: 'oneCell',
            })
          } catch (error) {
            console.error(`Failed to embed signature image for participant ${participant.email}:`, error)
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
