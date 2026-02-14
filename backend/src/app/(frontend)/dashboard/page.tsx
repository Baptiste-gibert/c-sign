'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { OrganizerLayout } from '@/components/OrganizerLayout'
import { DashboardPage } from '@/views/DashboardPage'

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <OrganizerLayout>
        <DashboardPage />
      </OrganizerLayout>
    </ProtectedRoute>
  )
}
