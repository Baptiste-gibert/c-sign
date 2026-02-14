'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { OrganizerLayout } from '@/components/OrganizerLayout'
import { EventDetailPage } from '@/pages/EventDetailPage'

export default function EventDetail() {
  return (
    <ProtectedRoute>
      <OrganizerLayout>
        <EventDetailPage />
      </OrganizerLayout>
    </ProtectedRoute>
  )
}
