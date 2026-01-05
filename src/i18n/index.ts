import enTranslations from './locales/en.json'
import nlTranslations from './locales/nl.json'
import arTranslations from './locales/ar.json'

export type Language = 'en' | 'nl' | 'ar'

export const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' }
]

const translations: Record<Language, any> = {
  en: enTranslations,
  nl: nlTranslations,
  ar: arTranslations
}

// Simple translation function
export function t(key: string, params?: Record<string, any>): string {
  const language = getCurrentLanguage()
  const keys = key.split('.')
  let value: any = translations[language]

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      // Fallback to English if translation not found
      value = translations.en
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey]
        } else {
          return key // Return key if translation not found
        }
      }
      break
    }
  }

  if (typeof value !== 'string') {
    return key
  }

  // Handle pluralization first (check if plural key exists)
  if (params && 'count' in params && params.count !== undefined) {
    const pluralKey = key + '_plural'
    const pluralKeys = pluralKey.split('.')
    let pluralValue: any = translations[language]
    
    for (const k of pluralKeys) {
      if (pluralValue && typeof pluralValue === 'object' && k in pluralValue) {
        pluralValue = pluralValue[k]
      } else {
        pluralValue = null
        break
      }
    }
    
    // Use plural if count !== 1 and plural exists
    if (pluralValue && typeof pluralValue === 'string' && params.count !== 1) {
      value = pluralValue
    }
  }

  // Replace parameters
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (match: string, paramKey: string) => {
      return params[paramKey] !== undefined ? String(params[paramKey]) : match
    })
  }

  return value
}

export function getCurrentLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem('language') as Language
  if (stored && ['en', 'nl', 'ar'].includes(stored)) {
    return stored
  }
  // Detect browser language
  const browserLang = navigator.language.split('-')[0]
  if (browserLang === 'nl') return 'nl'
  if (browserLang === 'ar') return 'ar'
  return 'en'
}

export function setLanguage(language: Language, reload = true) {
  localStorage.setItem('language', language)
  // Trigger a custom event to notify components
  window.dispatchEvent(new Event('languagechange'))
  // Reload to apply RTL/LTR changes (can be disabled for programmatic changes)
  if (reload) {
    window.location.reload()
  }
}

export function getTextDirection(language: Language): 'ltr' | 'rtl' {
  return language === 'ar' ? 'rtl' : 'ltr'
}

