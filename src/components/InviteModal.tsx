import { useState } from 'react'
import { X, Copy, Check, Share2 } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import toast from 'react-hot-toast'
import { getPublicUrl } from '@/utils/device'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  householdId: string
  householdName: string
}

export default function InviteModal({ isOpen, onClose, householdId, householdName }: InviteModalProps) {
  const [copied, setCopied] = useState(false)
  const { t } = useTranslation()

  if (!isOpen) return null

  const inviteLink = `${getPublicUrl()}/join/${householdId}`
  const inviteCode = householdId

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success(t('household.copiedToClipboard', { label }))
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      toast.error(t('household.failedToCopy'))
    })
  }

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('household.shareTitle', { householdName }),
          text: t('household.shareText', { householdName }),
          url: inviteLink
        })
        toast.success(t('household.shared'))
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          copyToClipboard(inviteLink, t('household.inviteLink'))
        }
      }
    } else {
      copyToClipboard(inviteLink, t('household.inviteLink'))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('household.inviteToHousehold')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p 
              className="text-sm text-gray-600 dark:text-gray-400 mb-4"
              dangerouslySetInnerHTML={{ __html: t('household.shareDescription', { householdName }) }}
            />
          </div>

          {/* Invite Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('household.inviteLink')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={() => copyToClipboard(inviteLink, t('household.inviteLink'))}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={shareLink}
              className="mt-2 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <Share2 className="w-4 h-4" />
              {t('household.shareVia')}
            </button>
          </div>

          {/* Household ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('household.householdIdAlternative')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteCode}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm font-mono text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={() => copyToClipboard(inviteCode, t('household.householdId'))}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('household.idJoinManually')}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">{t('household.howToJoin')}</h3>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>{t('household.joinStep1')}</li>
              <li>{t('household.joinStep2')}</li>
              <li>{t('household.joinStep3')}</li>
              <li>{t('household.joinStep4')}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

