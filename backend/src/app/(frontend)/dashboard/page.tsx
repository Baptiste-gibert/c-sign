'use client'

import { OrganizerLayout } from '@/components/OrganizerLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
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
