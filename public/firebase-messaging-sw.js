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
