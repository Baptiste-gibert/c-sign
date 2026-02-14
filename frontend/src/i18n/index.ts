import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import commonFr from './locales/fr/common.json'
import publicFr from './locales/fr/public.json'
import organizerFr from './locales/fr/organizer.json'

import commonEn from './locales/en/common.json'
import publicEn from './locales/en/public.json'
import organizerEn from './locales/en/organizer.json'

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
    fallbackLng: 'fr',
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: {
      escapeValue: false, // React already handles escaping
    },
  })

export default i18n
