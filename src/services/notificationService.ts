import { messaging } from '@/firebase/config'
import { getToken } from 'firebase/messaging'
import { requestNotificationPermission } from '@/firebase/config'

// Store notification token in localStorage
const NOTIFICATION_TOKEN_KEY = 'fcm_notification_token'

export async function getNotificationToken(): Promise<string | null> {
  try {
    // Check if we're in a native Capacitor app
    const isNativeApp = typeof window !== 'undefined' && !!(window as any).Capacitor
    
    // For native apps, use the requestNotificationPermission function which handles Capacitor Push Notifications
    if (isNativeApp) {
      const token = await requestNotificationPermission()
      if (token) {
        localStorage.setItem(NOTIFICATION_TOKEN_KEY, token)
      }
      return token
    }
    
    // For web apps, use Firebase Messaging SDK
    if (!messaging) return null
    
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
    if (!vapidKey || vapidKey === 'demo-vapid-key' || vapidKey.trim() === '') {
      return null
    }

    // Check if Notification API is available
    if (typeof Notification === 'undefined') {
      return null
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return null
    }

    const token = await getToken(messaging, { vapidKey })
    if (token) {
      localStorage.setItem(NOTIFICATION_TOKEN_KEY, token)
    }
    return token
  } catch (error) {
    console.error('Error getting notification token:', error)
    return null
  }
}

export function getStoredNotificationToken(): string | null {
  return localStorage.getItem(NOTIFICATION_TOKEN_KEY)
}

// Schedule daily notification check
export function scheduleDailyNotificationCheck(
  onCheck: () => void
) {
  // Check if service worker is supported
  if (!('serviceWorker' in navigator)) {
    return
  }

  // Check if notifications are supported
  if (!('Notification' in window)) {
    return
  }

  // Check permission
  if (Notification.permission !== 'granted') {
    return
  }

  // Get service worker registration
  navigator.serviceWorker.ready.then(() => {
    // Schedule check for today at 8 AM (or next 8 AM if already past)
    const now = new Date()
    const today8AM = new Date()
    today8AM.setHours(8, 0, 0, 0)
    
    // If it's already past 8 AM today, schedule for tomorrow
    if (now > today8AM) {
      today8AM.setDate(today8AM.getDate() + 1)
    }

    const msUntil8AM = today8AM.getTime() - now.getTime()

    // Schedule the notification
    setTimeout(() => {
      // Check task count and send notification
      onCheck() // Will be called with actual count from Dashboard
      
      // Schedule for next day
      scheduleDailyNotificationCheck(onCheck)
    }, msUntil8AM)
  })
}

// Send daily notification via service worker
export async function sendDailyNotification(taskCount: number) {
  try {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported')
    }

    if (!('Notification' in window)) {
      throw new Error('Notifications are not supported')
    }

    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted')
    }

    const registration = await navigator.serviceWorker.ready

    if (taskCount === 0) {
      // Don't send notification if no tasks
      return
    }

    const title = taskCount === 1 
      ? '1 task due today! 📋'
      : `${taskCount} tasks due today! 📋`
    
    const body = taskCount === 1
      ? 'You have 1 task to complete today. Check it out!'
      : `You have ${taskCount} tasks to complete today. Let's get started!`

    await registration.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'daily-tasks-reminder',
      requireInteraction: false,
      data: {
        url: window.location.origin,
        type: 'daily-reminder'
      }
    } as NotificationOptions)
  } catch (error: any) {
    console.error('Error sending daily notification:', error)
    throw error
  }
}

