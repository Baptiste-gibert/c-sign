import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function SuccessPage() {
  const { t } = useTranslation('public')
  const location = useLocation()
  const participantName = location.state?.participantName

  return (
    <div className="max-w-lg mx-auto px-4 py-6 min-h-screen flex items-center justify-center">
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">
                {participantName ? t('successTitle', { name: participantName }) : t('successTitleDefault')}
              </h1>
              <p className="text-muted-foreground">
                {t('successMessage')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
