import { Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SignPage } from '@/pages/SignPage'
import { SuccessPage } from '@/pages/SuccessPage'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { EventCreatePage } from '@/pages/EventCreatePage'
import { EventDetailPage } from '@/pages/EventDetailPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { OrganizerLayout } from '@/components/OrganizerLayout'

const queryClient = new QueryClient()

function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <h1 className="text-4xl font-bold text-neutral-900">c-sign</h1>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/sign/:dayId" element={<SignPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected organizer routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <OrganizerLayout>
                <DashboardPage />
              </OrganizerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/new"
          element={
            <ProtectedRoute>
              <OrganizerLayout>
                <EventCreatePage />
              </OrganizerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id"
          element={
            <ProtectedRoute>
              <OrganizerLayout>
                <EventDetailPage />
              </OrganizerLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </QueryClientProvider>
  )
}

export default App
