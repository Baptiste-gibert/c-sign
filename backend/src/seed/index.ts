import type { Payload } from 'payload'

export const seed = async (payload: Payload): Promise<void> => {
  try {
    console.log('🌱 Starting seed process...')

    // Check if seed data already exists
    const existingAdmin = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: 'admin@ceva.com',
        },
      },
      limit: 1,
    })

    if (existingAdmin.docs.length > 0) {
      console.log('✓ Seed data already exists (admin@ceva.com found). Skipping seed.')
      return
    }

    // 1. Create Admin user
    console.log('Creating admin user...')
    const admin = await payload.create({
      collection: 'users',
      data: {
        email: 'admin@ceva.com',
        password: 'admin123',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'Ceva',
      },
    })
    console.log(`✓ Created admin user: ${admin.email}`)

    // 2. Create Organizer user (Isabelle)
    console.log('Creating organizer user (Isabelle)...')
    const isabelle = await payload.create({
      collection: 'users',
      data: {
        email: 'isabelle.leroy@ceva.com',
        password: 'organizer123',
        role: 'organizer',
        firstName: 'Isabelle',
        lastName: 'Leroy',
      },
    })
    console.log(`✓ Created organizer user: ${isabelle.email}`)

    // 3. Create second organizer (Marc)
    console.log('Creating organizer user (Marc)...')
    const marc = await payload.create({
      collection: 'users',
      data: {
        email: 'marc.dupont@ceva.com',
        password: 'organizer123',
        role: 'organizer',
        firstName: 'Marc',
        lastName: 'Dupont',
      },
    })
    console.log(`✓ Created organizer user: ${marc.email}`)

    // 4. Create Event 1 (by Isabelle) with non-consecutive dates
    console.log('Creating Event 1 (Formation Veterinaires)...')
    const event1 = await payload.create({
      collection: 'events',
      data: {
        title: 'Formation Veterinaires - Q1 2026',
        location: 'Libourne, France',
        selectedDates: [
          { date: '2026-03-15' },
          { date: '2026-03-16' },
          { date: '2026-03-18' }, // Non-consecutive
        ],
        expenseType: 'hospitality_catering',
        organizerName: 'Isabelle Leroy',
        organizerEmail: 'isabelle.leroy@ceva.com',
        createdBy: isabelle.id,
      },
      overrideAccess: true, // Bypass access control during seeding
    })
    console.log(`✓ Created Event 1: ${event1.title} (ID: ${event1.id})`)

    // 5. Create Event 2 (by Marc)
    console.log('Creating Event 2 (Reunion Pharmaciens)...')
    const event2 = await payload.create({
      collection: 'events',
      data: {
        title: 'Reunion Pharmaciens - Bordeaux',
        location: 'Bordeaux, France',
        selectedDates: [{ date: '2026-04-10' }],
        expenseType: 'hospitality_snack',
        organizerName: 'Marc Dupont',
        organizerEmail: 'marc.dupont@ceva.com',
        createdBy: marc.id,
      },
      overrideAccess: true,
    })
    console.log(`✓ Created Event 2: ${event2.title} (ID: ${event2.id})`)

    // Wait a moment for hooks to execute
    await new Promise((resolve) => setTimeout(resolve, 500))

    // 6. Query AttendanceDays for Event 1 and create Sessions
    console.log('Querying AttendanceDays for Event 1...')
    const attendanceDaysResult = await payload.find({
      collection: 'attendance-days',
      where: {
        event: {
          equals: event1.id,
        },
      },
      sort: 'date',
    })

    if (attendanceDaysResult.docs.length === 0) {
      console.warn(
        '⚠ No AttendanceDays found for Event 1. Hook may not have executed. Continuing...',
      )
    } else {
      console.log(`✓ Found ${attendanceDaysResult.docs.length} AttendanceDays for Event 1`)

      // Create Sessions for the first day (March 15)
      const day1 = attendanceDaysResult.docs[0]
      console.log(`Creating sessions for AttendanceDay: ${day1.date} (ID: ${day1.id})`)

      const session1 = await payload.create({
        collection: 'sessions',
        data: {
          name: 'Conference matin',
          attendanceDay: day1.id,
        },
      })
      console.log(`✓ Created session: ${session1.name}`)

      const session2 = await payload.create({
        collection: 'sessions',
        data: {
          name: 'Dejeuner',
          attendanceDay: day1.id,
        },
      })
      console.log(`✓ Created session: ${session2.name}`)

      const session3 = await payload.create({
        collection: 'sessions',
        data: {
          name: 'Atelier apres-midi',
          attendanceDay: day1.id,
        },
      })
      console.log(`✓ Created session: ${session3.name}`)

      // Update the AttendanceDay to link sessions
      await payload.update({
        collection: 'attendance-days',
        id: day1.id,
        data: {
          sessions: [session1.id, session2.id, session3.id],
        },
      })
      console.log(`✓ Updated AttendanceDay ${day1.id} with session links`)
    }

    // 7. Create Participants with different beneficiary types
    console.log('Creating participants...')
    const participant1 = await payload.create({
      collection: 'participants',
      data: {
        lastName: 'Martin',
        firstName: 'Sophie',
        email: 'sophie.martin@vet.fr',
        city: 'Lyon',
        professionalNumber: 'VET-12345',
        beneficiaryType: 'veterinaire',
      },
    })
    console.log(`✓ Created participant: ${participant1.firstName} ${participant1.lastName}`)

    const participant2 = await payload.create({
      collection: 'participants',
      data: {
        lastName: 'Bernard',
        firstName: 'Pierre',
        email: 'pierre.bernard@pharma.fr',
        city: 'Paris',
        professionalNumber: 'PHA-67890',
        beneficiaryType: 'pharmacien',
      },
    })
    console.log(`✓ Created participant: ${participant2.firstName} ${participant2.lastName}`)

    const participant3 = await payload.create({
      collection: 'participants',
      data: {
        lastName: 'Petit',
        firstName: 'Marie',
        email: 'marie.petit@free.fr',
        city: 'Toulouse',
        beneficiaryType: 'autre',
        beneficiaryTypeOther: 'Consultante',
      },
    })
    console.log(`✓ Created participant: ${participant3.firstName} ${participant3.lastName}`)

    console.log('✅ Seed process completed successfully!')
    console.log('')
    console.log('Summary:')
    console.log(`- 3 users created (1 admin, 2 organizers)`)
    console.log(`- 2 events created (1 multi-day, 1 single-day)`)
    console.log(`- ${attendanceDaysResult.docs.length} attendance days auto-generated`)
    console.log(`- 3 sessions created for first day`)
    console.log(`- 3 participants created with different beneficiary types`)
  } catch (error) {
    console.error('❌ Seed process failed:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Stack trace:', error.stack)
    }
    throw error
  }
}
