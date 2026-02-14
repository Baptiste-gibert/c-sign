import type { CollectionAfterReadHook } from 'payload'

export const afterEventRead: CollectionAfterReadHook = async ({ doc, req }) => {
  try {
    // participantCount: length of participants array (IDs at depth=0)
    const participants = doc.participants || []
    doc.participantCount = Array.isArray(participants) ? participants.length : 0

    // signatureCount: count signatures across all sessions for this event's attendance days
    const attendanceDays = doc.attendanceDays || []
    if (!Array.isArray(attendanceDays) || attendanceDays.length === 0) {
      doc.signatureCount = 0
      return doc
    }

    // Get attendance day IDs (could be objects or strings depending on depth)
    const dayIds = attendanceDays.map((d: any) => (typeof d === 'object' ? d.id : d))

    // Find all sessions for these attendance days
    const sessions = await req.payload.find({
      collection: 'sessions',
      where: {
        attendanceDay: { in: dayIds },
      },
      limit: 0, // get all
      depth: 0,
      req,
    })

    if (sessions.docs.length === 0) {
      doc.signatureCount = 0
      return doc
    }

    const sessionIds = sessions.docs.map((s) => s.id)

    // Count signatures for these sessions
    const signatureResult = await req.payload.count({
      collection: 'signatures',
      where: {
        session: { in: sessionIds },
      },
      req,
    })

    doc.signatureCount = signatureResult.totalDocs
  } catch {
    // Don't fail the read if counting fails
    doc.signatureCount = 0
    doc.participantCount = doc.participantCount ?? 0
  }

  return doc
}
