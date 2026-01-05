#!/bin/bash

echo "🔥 Firebase Setup Helper for household-chores-d8eae"
echo ""
echo "This script will help you set up your Firebase configuration."
echo ""
echo "📋 You'll need to get these values from Firebase Console:"
echo "   1. Go to: https://console.firebase.google.com/project/household-chores-d8eae/settings/general"
echo "   2. Scroll to 'Your apps' section"
echo "   3. Copy the firebaseConfig values"
echo ""
read -p "Press Enter when you're ready to continue..."

echo ""
echo "Please enter your Firebase configuration values:"
echo ""

read -p "API Key: " API_KEY
read -p "Auth Domain (default: household-chores-d8eae.firebaseapp.com): " AUTH_DOMAIN
AUTH_DOMAIN=${AUTH_DOMAIN:-household-chores-d8eae.firebaseapp.com}
read -p "Project ID (default: household-chores-d8eae): " PROJECT_ID
PROJECT_ID=${PROJECT_ID:-household-chores-d8eae}
read -p "Storage Bucket (default: household-chores-d8eae.appspot.com): " STORAGE_BUCKET
STORAGE_BUCKET=${STORAGE_BUCKET:-household-chores-d8eae.appspot.com}
read -p "Messaging Sender ID: " MESSAGING_SENDER_ID
read -p "App ID: " APP_ID
read -p "Measurement ID (optional, press Enter to skip): " MEASUREMENT_ID

echo ""
echo "Now get your VAPID key from:"
echo "https://console.firebase.google.com/project/household-chores-d8eae/settings/cloudmessaging"
read -p "VAPID Key: " VAPID_KEY

echo ""
echo "Creating .env file..."

cat > .env << EOF
VITE_FIREBASE_API_KEY=$API_KEY
VITE_FIREBASE_AUTH_DOMAIN=$AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=$PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=$STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=$MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=$APP_ID
VITE_FIREBASE_MEASUREMENT_ID=$MEASUREMENT_ID
VITE_FIREBASE_VAPID_KEY=$VAPID_KEY
EOF

echo ""
echo "Updating firebase-messaging-sw.js..."

cat > public/firebase-messaging-sw.js << EOF
// Service Worker for Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Initialize Firebase
const firebaseConfig = {
  apiKey: "$API_KEY",
  authDomain: "$AUTH_DOMAIN",
  projectId: "$PROJECT_ID",
  storageBucket: "$STORAGE_BUCKET",
  messagingSenderId: "$MESSAGING_SENDER_ID",
  appId: "$APP_ID",
  measurementId: "$MEASUREMENT_ID"
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
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure Authentication is enabled in Firebase Console"
echo "2. Make sure Firestore is created"
echo "3. Deploy Firestore rules: firebase deploy --only firestore:rules,firestore:indexes"
echo "4. Run: npm run dev"
echo ""

