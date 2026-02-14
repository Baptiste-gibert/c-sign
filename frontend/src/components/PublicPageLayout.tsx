import { useTheme } from '@/contexts/ThemeContext'

interface PublicPageLayoutProps {
  children: React.ReactNode
  eventTitle?: string
  eventDate?: string
  headerRight?: React.ReactNode
}

export function PublicPageLayout({
  children,
  eventTitle,
  eventDate,
  headerRight,
}: PublicPageLayoutProps) {
  const { theme } = useTheme()

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header with generative gradient */}
      <header
        className="py-6 sm:py-8"
        style={{ background: theme.headerBg }}
      >
        <div className="max-w-[640px] mx-auto px-4">
          {/* Top bar with logo and header right slot */}
          <div className="flex justify-between items-center">
            <div>
              <span
                className="font-bold text-sm tracking-widest uppercase"
                style={{ color: 'var(--accent)' }}
              >
                C-SIGN
              </span>
            </div>
            {headerRight && <div>{headerRight}</div>}
          </div>

          {/* Event title */}
          {eventTitle && (
            <h1
              className="text-[30px] font-bold mt-3"
              style={{
                color: 'var(--text)',
                letterSpacing: '-0.5px',
              }}
            >
              {eventTitle}
            </h1>
          )}

          {/* Event date */}
          {eventDate && (
            <p
              className="text-[13px] mt-1"
              style={{ color: 'var(--text-sec)' }}
            >
              {eventDate}
            </p>
          )}

          {/* Accent line separator */}
          <div
            className="h-[1.5px] mt-4"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            }}
          />
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-[640px] mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="max-w-[640px] mx-auto px-4 py-4 text-center">
        <p
          className="text-[8px] tracking-wide"
          style={{ color: 'var(--text-sec)' }}
        >
          C-Sign v1.0
        </p>
      </footer>
    </div>
  )
}
