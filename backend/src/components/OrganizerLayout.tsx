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
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/dashboard" className="text-xl font-bold text-neutral-900">
              c-sign
            </Link>
            <nav className="flex items-center gap-3 sm:gap-6">
              <Link
                href="/dashboard"
                className="text-xs font-medium text-neutral-700 hover:text-neutral-900 sm:text-sm"
              >
                {t('navigation.events')}
              </Link>
              <Link
                href="/events/new"
                className="text-xs font-medium text-neutral-700 hover:text-neutral-900 sm:text-sm"
              >
                {t('navigation.newEvent')}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {user && (
              <span className="text-xs text-neutral-700 sm:text-sm">
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
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  )
}
