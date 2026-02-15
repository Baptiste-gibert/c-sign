'use client'

import { OrganizerLayout } from '@/components/OrganizerLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { EventDetailPage } from '@/views/EventDetailPage'

export default function EventDetail() {
  return (
    <ProtectedRoute>
      <OrganizerLayout>
        <EventDetailPage />
      </OrganizerLayout>
    </ProtectedRoute>
  )
}
