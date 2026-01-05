// Service Worker for Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAx59ISocT3_RNYhvIuPRsdNjKcyoQOLZQ",
  authDomain: "household-chores-d8eae.firebaseapp.com",
  projectId: "household-chores-d8eae",
  storageBucket: "household-chores-d8eae.firebasestorage.app",
  messagingSenderId: "590220309328",
  appId: "1:590220309328:web:efa1818f860d166ee6f255",
  measurementId: "G-D31RXV6JNR"
}

firebase.initializeApp(firebaseConfig)

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload)
  
  const notificationTitle = payload.notification?.title || 'New Task'
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new task to complete',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png'
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle messages from the client to schedule delayed notifications
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data)
  
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { delay, title, body } = event.data
    
    // Schedule notification after delay
    setTimeout(() => {
      const notificationOptions = {
        body: body || 'This is a delayed test notification!',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'delayed-test-notification',
        requireInteraction: false,
        vibrate: [200, 100, 200]
      }
      
      self.registration.showNotification(
        title || 'Delayed Test Notification',
        notificationOptions
      )
      
      console.log('Delayed notification shown')
    }, delay)
    
    // Send confirmation back to client
    event.ports[0].postMessage({ success: true, scheduled: true })
  }
})
