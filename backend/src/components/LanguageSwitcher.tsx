import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr'
    i18n.changeLanguage(newLang)
  }

  const displayLang = i18n.language === 'fr' ? 'EN' : 'FR'

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      aria-label={`Switch to ${displayLang}`}
    >
      <Languages className="mr-2 h-4 w-4" />
      {displayLang}
    </Button>
  )
}
