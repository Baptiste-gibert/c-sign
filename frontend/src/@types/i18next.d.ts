import 'i18next'
import commonEn from '../i18n/locales/en/common.json'
import publicEn from '../i18n/locales/en/public.json'
import organizerEn from '../i18n/locales/en/organizer.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof commonEn
      public: typeof publicEn
      organizer: typeof organizerEn
    }
  }
}
