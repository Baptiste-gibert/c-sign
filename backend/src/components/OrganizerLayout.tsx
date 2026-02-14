import Link from 'next/link'
import { useNavigate } from '@/lib/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation('organizer')
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
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/dashboard" className="text-xl font-bold text-neutral-900">
              c-sign
            </Link>
            <nav className="flex items-center gap-3 sm:gap-6">
              <Link
                href="/dashboard"
                className="text-xs sm:text-sm font-medium text-neutral-700 hover:text-neutral-900"
              >
                {t('navigation.events')}
              </Link>
              <Link
                href="/events/new"
                className="text-xs sm:text-sm font-medium text-neutral-700 hover:text-neutral-900"
              >
                {t('navigation.newEvent')}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {user && (
              <span className="text-xs sm:text-sm text-neutral-700">
                {user.firstName} {user.lastName}
              </span>
            )}
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              {t('navigation.logout')}
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-neutral-50 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto w-full">{children}</div>
      </main>
    </div>
  )
}
