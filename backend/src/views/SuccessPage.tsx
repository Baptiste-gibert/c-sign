'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { PublicPageLayout } from '@/components/PublicPageLayout'

function SuccessContent() {
  const { t } = useTranslation('public')
  const searchParams = useSearchParams()
  const participantName = searchParams?.get('participantName') ?? null
  const themeId = searchParams?.get('themeId') ?? undefined
  const customAccent = searchParams?.get('customAccent') ?? undefined
  const mode = (searchParams?.get('mode') as 'dark' | 'light') || 'dark'

  return (
    <ThemeProvider themeId={themeId} customAccent={customAccent} mode={mode}>
      <PublicPageLayout>
        <div className="animate-success-appear flex flex-col items-center space-y-6 py-8 text-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--success) 15%, transparent)',
              border: '2px solid var(--success)',
            }}
          >
            <CheckCircle style={{ color: 'var(--success)' }} className="h-10 w-10" />
          </div>

          <div className="space-y-3">
            <h1
              className="text-[30px] font-bold tracking-[-0.5px]"
              style={{ color: 'var(--text)' }}
            >
              {participantName
                ? t('successTitle', { name: participantName })
                : t('successTitleDefault')}
            </h1>
            <p className="text-[13px]" style={{ color: 'var(--text-sec)' }}>
              {t('successMessage')}
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="mt-4 h-10 rounded-lg px-6 text-[13px] font-semibold"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            <Link href="/">{t('newSignature') || 'Nouvelle signature'}</Link>
          </Button>
        </div>
      </PublicPageLayout>
    </ThemeProvider>
  )
}

export function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
