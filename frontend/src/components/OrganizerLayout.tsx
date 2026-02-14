import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        navigate('/login')
      },
    })
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-neutral-200">
        <div className="px-4 py-3 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="text-xl font-bold text-neutral-900">
              c-sign
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                to="/dashboard"
                className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
              >
                Événements
              </Link>
              <Link
                to="/events/new"
                className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
              >
                Nouvel événement
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-neutral-700">
                {user.firstName} {user.lastName}
              </span>
            )}
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-neutral-50 p-6">
        <div className="max-w-7xl mx-auto w-full">{children}</div>
      </main>
    </div>
  )
}
