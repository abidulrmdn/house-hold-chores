import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsStandalone(true)
      return
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Check if user has dismissed before (localStorage)
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return
      }
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show prompt after 3 seconds
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For iOS, show prompt immediately if on mobile
    if (iOS && window.innerWidth < 768) {
      setTimeout(() => {
        setShowPrompt(true)
      }, 5000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android/Chrome
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
        localStorage.setItem('pwa-install-dismissed', Date.now().toString())
      }
      setDeferredPrompt(null)
    } else {
      // iOS - just hide and let user follow instructions
      setShowPrompt(false)
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (isStandalone || !showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white dark:bg-gray-800 border-2 border-primary-500 rounded-lg shadow-xl p-4 z-[100] animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {t('install.installApp')}
          </h3>
          {isIOS ? (
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>{t('install.addToHomeScreen')}</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>{t('install.iosStep1')}</li>
                <li>{t('install.iosStep2')}</li>
                <li>{t('install.iosStep3')}</li>
              </ol>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('install.installDescription')}
            </p>
          )}
          <div className="flex gap-2 mt-3">
            {!isIOS && (
              <button
                onClick={handleInstall}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('install.install')}
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm transition-colors"
            >
              {t('install.maybeLater')}
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

