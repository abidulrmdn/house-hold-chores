import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { getFunctions } from 'firebase/functions'
import { getStorage } from 'firebase/storage'

// Firebase configuration - will be replaced with your actual config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:demo',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-DEMO'
}

// Check if Firebase is properly configured
const isFirebaseConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_API_KEY !== 'your_api_key_here' &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID !== 'your_project_id'
)

export const isConfigured = isFirebaseConfigured

// Initialize Firebase only if configured
let app: ReturnType<typeof initializeApp> | null = null
let auth: ReturnType<typeof getAuth> | null = null
let db: ReturnType<typeof getFirestore> | null = null
let googleProvider: GoogleAuthProvider | null = null

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    googleProvider = new GoogleAuthProvider()
  } catch (error) {
    console.error('Firebase initialization error:', error)
  }
} else {
  console.warn('⚠️ Firebase not configured. Please set up your .env file. See README.md for instructions.')
  // Create dummy objects to prevent crashes
  // These will throw errors when used, but won't crash the app initialization
  try {
    const dummyConfig = {
      apiKey: 'demo-key',
      authDomain: 'demo.firebaseapp.com',
      projectId: 'demo-project',
      storageBucket: 'demo.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:demo'
    }
    app = initializeApp(dummyConfig, 'demo-app')
    auth = getAuth(app)
    db = getFirestore(app)
    googleProvider = new GoogleAuthProvider()
  } catch (error) {
    // If even dummy config fails, we'll handle it in components
    console.warn('Could not initialize Firebase even with dummy config:', error)
  }
}

// Initialize Functions
let functions: ReturnType<typeof getFunctions> | null = null

if (app) {
  try {
    functions = getFunctions(app)
  } catch (error) {
    console.warn('Firebase Functions initialization failed:', error)
  }
}

// Initialize Storage
let storage: ReturnType<typeof getStorage> | null = null

if (app) {
  try {
    storage = getStorage(app)
  } catch (error) {
    console.warn('Firebase Storage initialization failed:', error)
  }
}

// Export with type assertions - components will check isConfigured before using
export { auth, db, googleProvider, functions, storage }

// Initialize messaging (only in browser, not in service worker)
let messaging: ReturnType<typeof getMessaging> | null = null

if (typeof window !== 'undefined' && 'serviceWorker' in navigator && app) {
  try {
    messaging = getMessaging(app)
  } catch (error) {
    console.warn('Firebase Messaging initialization failed:', error)
  }
}

export { messaging }

// Request notification permission and get token
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) {
    console.warn('Firebase Messaging not initialized')
    return null
  }

  try {
    // Check if VAPID key is configured
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
    console.log('VAPID Key check in requestNotificationPermission:', {
      exists: !!vapidKey,
      length: vapidKey?.length || 0,
      isEmpty: !vapidKey || vapidKey.trim() === '',
      isDemo: vapidKey === 'demo-vapid-key'
    })
    
    if (!vapidKey || vapidKey === 'demo-vapid-key' || vapidKey.trim() === '') {
      // Notifications not configured
      console.warn('VAPID key not configured. Add VITE_FIREBASE_VAPID_KEY to .env and restart dev server.')
      return null
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: vapidKey
      })
      return token
    }
  } catch (error: any) {
    // Log notification errors for debugging
    if (error?.code === 'messaging/invalid-vapid-key' || 
        error?.message?.includes('applicationServerKey')) {
      console.error('Invalid VAPID key. Please check your VITE_FIREBASE_VAPID_KEY in .env file:', error.message)
    } else {
      console.error('Notification error:', error.message)
    }
  }
  return null
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) return () => {}

  return onMessage(messaging, callback)
}

// Send a test notification (for testing purposes)
export async function sendTestNotification() {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications')
    }

    // Check permission
    if (Notification.permission === 'denied') {
      throw new Error('Notification permission denied. Please enable it in your browser settings.')
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted')
      }
    }

    // Send test notification
    const notification = new Notification('Test Notification', {
      body: 'This is a test notification from Routine Manager! 🎉',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'test-notification',
      requireInteraction: false
    })

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close()
    }, 5000)

    return true
  } catch (error: any) {
    console.error('Error sending test notification:', error)
    throw error
  }
}

// Schedule a delayed push notification (works even when browser is closed)
export async function scheduleDelayedNotification(delaySeconds: number = 30) {
  try {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported in this browser')
    }

    // Check if notifications are supported
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications')
    }

    // Check permission
    if (Notification.permission === 'denied') {
      throw new Error('Notification permission denied. Please enable it in your browser settings.')
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted')
      }
    }

    // Get the service worker registration
    const registration = await navigator.serviceWorker.ready

    // Create a message channel for communication
    const messageChannel = new MessageChannel()

    // Set up message handler
    messageChannel.port1.onmessage = (event) => {
      if (event.data.success) {
        console.log(`Notification scheduled for ${delaySeconds} seconds`)
      }
    }

    // Send message to service worker to schedule notification
    registration.active?.postMessage(
      {
        type: 'SCHEDULE_NOTIFICATION',
        delay: delaySeconds * 1000, // Convert to milliseconds
        title: 'Delayed Test Notification',
        body: `This is a delayed push notification! It was scheduled ${delaySeconds} seconds ago. You can close the browser now! 📱`
      },
      [messageChannel.port2]
    )

    return true
  } catch (error: any) {
    console.error('Error scheduling delayed notification:', error)
    throw error
  }
}

