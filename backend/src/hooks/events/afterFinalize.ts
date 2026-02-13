import type { CollectionAfterChangeHook } from 'payload'
import { generateEventXLSX } from '@/lib/export/generateXLSX'
import { buildFinalizeEmailTemplate } from '@/lib/email/templates'

/**
 * Hook that triggers XLSX export and email delivery when event is finalized
 */
export const afterFinalize: CollectionAfterChangeHook = async ({ doc, previousDoc, req, operation }) => {
  // Only trigger on update when status changes to finalized
  if (
    operation === 'update' &&
    doc.status === 'finalized' &&
    previousDoc?.status !== 'finalized'
  ) {
    // Fire-and-forget to avoid blocking the HTTP response
    generateAndEmailExport(req, doc).catch((error) => {
      console.error(`Failed to generate/email export for event ${doc.id}:`, error)
    })
  }

  return doc
}

/**
 * Generate XLSX and send email with attachment
 */
async function generateAndEmailExport(req: any, doc: any): Promise<void> {
  console.log(`Generating export for event ${doc.id} (${doc.title})`)

  // Generate XLSX
  const xlsxBuffer = await generateEventXLSX(req.payload, doc.id)

  // Log file size
  const fileSizeMB = (xlsxBuffer.length / 1024 / 1024).toFixed(2)
  console.log(`Generated XLSX: ${fileSizeMB} MB`)

  // Build filename (sanitize title)
  const titleSlug = doc.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `feuille-presence-${titleSlug}-${dateStr}.xlsx`

  // Build recipients
  const recipients = ['transparence@ceva.com', doc.organizerEmail]

  // Build email HTML
  const html = buildFinalizeEmailTemplate({
    title: doc.title,
    organizerName: doc.organizerName,
    location: doc.location,
    expenseType: doc.expenseType,
  })

  // Send email
  await req.payload.sendEmail({
    to: recipients.join(', '),
    subject: `Feuille de presence - ${doc.title}`,
    html,
    attachments: [
      {
        filename,
        content: xlsxBuffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ],
  })

  console.log(`Email sent successfully to: ${recipients.join(', ')}`)
}
