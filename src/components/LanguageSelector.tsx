import { Globe } from 'lucide-react'
import { useLanguageStore } from '@/store/useLanguageStore'
import { languages } from '@/i18n'
import { useTranslation } from '@/hooks/useTranslation'

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguageStore()
  const { t } = useTranslation()

  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-2 mb-2 px-2">
        <Globe className="w-4 h-4 text-gray-500" />
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {t('language.language')}
        </span>
      </div>
      <div className="space-y-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`w-full px-4 py-2 text-left text-sm rounded-lg transition-colors flex items-center justify-between ${
              language === lang.code
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span>{lang.nativeName}</span>
            {language === lang.code && (
              <span className="text-primary-600 dark:text-primary-400">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

