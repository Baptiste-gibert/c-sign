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

  return (
    <ThemeProvider>
      <PublicPageLayout>
        <div className="flex flex-col items-center text-center space-y-6 py-8 animate-success-appear">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--success) 15%, transparent)',
              border: '2px solid var(--success)',
            }}
          >
            <CheckCircle style={{ color: 'var(--success)' }} className="w-10 h-10" />
          </div>

          <div className="space-y-3">
            <h1 className="text-[30px] font-bold tracking-[-0.5px]" style={{ color: 'var(--text)' }}>
              {participantName ? t('successTitle', { name: participantName }) : t('successTitleDefault')}
            </h1>
            <p className="text-[13px]" style={{ color: 'var(--text-sec)' }}>
              {t('successMessage')}
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="mt-4 h-10 px-6 rounded-lg text-[13px] font-semibold"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            <Link href="/">
              {t('newSignature') || 'Nouvelle signature'}
            </Link>
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
