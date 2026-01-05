import { useLanguageStore } from '@/store/useLanguageStore'
import { t as translate } from '@/i18n'

export function useTranslation() {
  const { language } = useLanguageStore()
  
  const t = (key: string, params?: Record<string, any>) => {
    return translate(key, params)
  }
  
  return { t, language }
}

