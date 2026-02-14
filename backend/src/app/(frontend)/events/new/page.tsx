'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { OrganizerLayout } from '@/components/OrganizerLayout'
import { EventCreatePage } from '@/views/EventCreatePage'

export default function EventCreate() {
  return (
    <ProtectedRoute>
      <OrganizerLayout>
        <EventCreatePage />
      </OrganizerLayout>
    </ProtectedRoute>
  )
}
