import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { log } from '../utils/logger';

// Define supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  ru: 'Русский',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Define namespaces
export const NAMESPACES = [
  'common',
  'dashboard',
  'tokens',
  'locking',
  'governance',
] as const;

export type Namespace = typeof NAMESPACES[number];

// i18next configuration
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Language settings
    lng: 'en', // default language
    fallbackLng: 'en',
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    
    // Namespace settings
    ns: NAMESPACES,
    defaultNS: 'common',
    
    // Backend configuration
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      requestOptions: {
        cache: 'default',
      },
    },
    
    // Language detection
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    
    // Interpolation
    interpolation: {
      escapeValue: false, // React already escapes
      formatSeparator: ',',
    },
    
    // React specific
    react: {
      useSuspense: true, // Enable suspense for proper loading
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em'],
    },
    
    // Development
    debug: process.env.NODE_ENV === 'development',
    
    // Performance
    load: 'languageOnly', // Load only language, not region
    preload: ['en', 'ru'],
    
    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Missing keys
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        log.warn('Missing translation key', {
          component: 'i18n',
          function: 'missingKeyHandler',
          language: lng,
          namespace: ns,
          key
        });
      }
    },
  });

export default i18n; 