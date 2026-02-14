'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { OrganizerLayout } from '@/components/OrganizerLayout'
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
