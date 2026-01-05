import { useState, useEffect } from 'react'
import { Users, X } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

interface InviteBannerProps {
  householdId: string
  onInviteClick: () => void
}

export default function InviteBanner({ householdId, onInviteClick }: InviteBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    // Check if banner has been dismissed for this household
    const dismissedKey = `invite-banner-dismissed-${householdId}`
    const isDismissed = localStorage.getItem(dismissedKey) === 'true'
    
    if (!isDismissed) {
      setIsVisible(true)
    }
  }, [householdId])

  const handleDismiss = () => {
    const dismissedKey = `invite-banner-dismissed-${householdId}`
    localStorage.setItem(dismissedKey, 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-primary-50 via-purple-50 to-pink-50 dark:from-primary-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-l-4 border-primary-500 dark:border-primary-400 rounded-lg p-4 mb-6 shadow-sm relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        aria-label={t('common.close')}
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3 pr-8">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {t('inviteBanner.title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {t('inviteBanner.description')}
          </p>
          <button
            onClick={() => {
              onInviteClick()
              handleDismiss() // Auto-dismiss when user clicks invite
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
          >
            <Users className="w-4 h-4" />
            {t('inviteBanner.inviteButton')}
          </button>
        </div>
      </div>
    </div>
  )
}

