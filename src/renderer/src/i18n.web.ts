import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Simple web-based i18n configuration
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          // Add minimal translations here as needed
        }
      }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
