import type { CollectionAfterChangeHook } from 'payload'

export const afterEventChange: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  // Prevent infinite loop
  if (req.context.preventLoop) {
    return doc
  }

  // Get selected dates from the event
  const selectedDates = doc.selectedDates || []

  // Query existing AttendanceDays for this event
  const existingDays = await req.payload.find({
    collection: 'attendance-days',
    where: {
      event: {
        equals: doc.id,
      },
    },
    limit: 1000,
    req,
  })

  // Create a set of existing dates for quick lookup
  const existingDatesSet = new Set(
    existingDays.docs.map((day) => {
      // Normalize to ISO date string
      const dateObj = new Date(day.date)
      return dateObj.toISOString().split('T')[0]
    })
  )

  // Track all attendance day IDs (existing + new)
  const allAttendanceDayIds = existingDays.docs.map((day) => day.id)

  // Create AttendanceDays for new dates
  for (const dateObj of selectedDates) {
    const dateStr = new Date(dateObj.date).toISOString().split('T')[0]

    if (!existingDatesSet.has(dateStr)) {
      // Date doesn't exist yet, create it
      const newDay = await req.payload.create({
        collection: 'attendance-days',
        data: {
          event: doc.id,
          date: dateObj.date,
        },
        req,
      })
      allAttendanceDayIds.push(newDay.id)

      // Check if daySessionConfig has session config for this date
      const dayConfig = (doc.daySessionConfig as any[])?.find((cfg: any) => {
        const cfgDate = new Date(cfg.date).toISOString().split('T')[0]
        return cfgDate === dateStr
      })

      if (dayConfig && Array.isArray(dayConfig.sessions) && dayConfig.sessions.length > 0) {
        // Create sessions from config
        for (const sessionCfg of dayConfig.sessions) {
          await req.payload.create({
            collection: 'sessions',
            data: {
              name: sessionCfg.name || 'Session principale',
              startTime: sessionCfg.startTime || undefined,
              endTime: sessionCfg.endTime || undefined,
              attendanceDay: newDay.id,
            },
            req,
          })
        }
      } else {
        // Fallback: create default session
        await req.payload.create({
          collection: 'sessions',
          data: {
            name: 'Session principale',
            attendanceDay: newDay.id,
          },
          req,
        })
      }
    }
  }

  // Update the Event's attendanceDays relationship with all IDs
  // Use preventLoop to avoid infinite recursion
  if (allAttendanceDayIds.length > 0) {
    await req.payload.update({
      collection: 'events',
      id: doc.id,
      data: {
        attendanceDays: allAttendanceDayIds,
      },
      context: {
        ...req.context,
        preventLoop: true,
      },
      req,
    })
  }

  return doc
}
