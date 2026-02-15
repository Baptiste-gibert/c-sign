'use client'

import { OrganizerLayout } from '@/components/OrganizerLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
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
