import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import commonEn from './locales/en/common.json'
import organizerEn from './locales/en/organizer.json'
import publicEn from './locales/en/public.json'
// Import translation files
import commonFr from './locales/fr/common.json'
import organizerFr from './locales/fr/organizer.json'
import publicFr from './locales/fr/public.json'

// Read cached language on client to match SSR output.
// LanguageDetector is NOT used at init (lng is set explicitly) to prevent
// hydration mismatches when navigator.language differs from the server default.
const cachedLng = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') || 'fr' : 'fr'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: {
        common: commonFr,
        public: publicFr,
        organizer: organizerFr,
      },
      en: {
        common: commonEn,
        public: publicEn,
        organizer: organizerEn,
      },
    },
    lng: cachedLng,
    fallbackLng: 'fr',
    defaultNS: 'common',
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false, // React already handles escaping
    },
  })

export default i18n
