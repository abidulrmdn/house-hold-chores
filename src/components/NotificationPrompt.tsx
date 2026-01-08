import { useState, useEffect } from 'react'
import { X, Bell, CheckCircle2 } from 'lucide-react'
import { isAndroid } from '@/utils/device'
import { requestNotificationPermission } from '@/firebase/config'
import { useAuthStore } from '@/store/useAuthStore'
import toast from 'react-hot-toast'

export default function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isEnabling, setIsEnabling] = useState(false)
  const { user } = useAuthStore()

  useEffect(() => {
    // Only show on Android mobile
    if (!isAndroid()) {
      return
    }

    // Check if user is logged in
    if (!user?.uid) {
      return
    }

    // Check if user has already been prompted (one-time only)
    const notificationPromptShown = localStorage.getItem('notification-prompt-shown')
    if (notificationPromptShown) {
      return
    }

    // Check if notifications are already enabled
    const checkNotificationStatus = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore')
        const { db } = await import('@/firebase/config')
        if (db && user?.uid) {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            // If notifications are already enabled, don't show prompt
            if (userData.notificationEnabled && userData.fcmToken) {
              return
            }
          }
        }
      } catch (error) {
        console.error('Error checking notification status:', error)
      }

      // Show prompt after a short delay (2 seconds) to let the app load
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 2000)

      return () => clearTimeout(timer)
    }

    checkNotificationStatus()
  }, [user?.uid])

  const handleEnable = async () => {
    if (!user?.uid) return

    setIsEnabling(true)
    try {
      const token = await requestNotificationPermission()
      if (token) {
        // Save token to Firestore
        try {
          const { doc, updateDoc } = await import('firebase/firestore')
          const { db } = await import('@/firebase/config')
          if (db) {
            await updateDoc(doc(db, 'users', user.uid), {
              fcmToken: token,
              notificationEnabled: true
            })
          }
        } catch (error) {
          console.error('Error saving FCM token:', error)
        }

        // Mark prompt as shown
        localStorage.setItem('notification-prompt-shown', 'true')
        setShowPrompt(false)
        toast.success('Notifications enabled! You\'ll receive updates when routines are created.')
      } else {
        toast.error('Failed to enable notifications. Please check app permissions in device settings.')
      }
    } catch (error: any) {
      console.error('Error enabling notifications:', error)
      toast.error(`Failed to enable notifications: ${error.message || 'Unknown error'}`)
    } finally {
      setIsEnabling(false)
    }
  }

  const handleDismiss = () => {
    // Mark prompt as shown (user dismissed, don't show again)
    localStorage.setItem('notification-prompt-shown', 'true')
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[200] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Bell className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Enable Notifications
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Stay updated with your household
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Get notified when:
          </p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
              <span>New routines are added to your household</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
              <span>Daily task reminders at 8 AM</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
              <span>Important updates from your household</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleEnable}
            disabled={isEnabling}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isEnabling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Enabling...</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span>Enable Notifications</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

