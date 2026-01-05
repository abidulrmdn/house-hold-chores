# Firebase Setup Instructions

## ✅ What's Already Done

- ✅ Firebase project connected: `household-chores-d8eae`
- ✅ `.firebaserc` created with your project ID
- ✅ Firebase config files ready
- ✅ Firestore rules and indexes ready

## 🚀 Quick Setup (Choose One Method)

### Method 1: Interactive Script (Easiest)

```bash
./setup-firebase.sh
```

This script will:
- Ask you for all Firebase config values
- Create `.env` file automatically
- Update service worker automatically

### Method 2: Manual Setup

#### Step 1: Get Firebase Config

1. **Go to Firebase Console:**
   https://console.firebase.google.com/project/household-chores-d8eae/settings/general

2. **Scroll to "Your apps" section**
   - If you don't have a web app, click the `</>` icon
   - Register app nickname: "Web App"
   - Click "Register app"

3. **Copy the config values:**
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",                    // ← Copy this
     authDomain: "...",                     // ← Copy this
     projectId: "household-chores-d8eae",   // ← Already know this
     storageBucket: "...",                  // ← Copy this
     messagingSenderId: "...",             // ← Copy this
     appId: "...",                          // ← Copy this
     measurementId: "..."                  // ← Copy this (optional)
   };
   ```

#### Step 2: Get VAPID Key

1. **Go to:** https://console.firebase.google.com/project/household-chores-d8eae/settings/cloudmessaging
2. Under **"Web configuration"**, click **"Generate key pair"**
3. Copy the key

#### Step 3: Create .env File

Create `.env` file in the project root:

```bash
cp .env.example .env
```

Then edit `.env` and fill in:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=household-chores-d8eae.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=household-chores-d8eae
VITE_FIREBASE_STORAGE_BUCKET=household-chores-d8eae.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
```

#### Step 4: Update Service Worker

Edit `public/firebase-messaging-sw.js` and replace the `firebaseConfig` object with your actual values.

## 🔧 Enable Required Services

### 1. Enable Authentication

**Go to:** https://console.firebase.google.com/project/household-chores-d8eae/authentication/providers

- ✅ Enable **Email/Password**
- ✅ Enable **Google** (add your support email when prompted)

### 2. Create Firestore Database

**Go to:** https://console.firebase.google.com/project/household-chores-d8eae/firestore

- Click **"Create database"**
- Start in **Production mode** (we'll deploy rules)
- Choose a location (closest to you)
- Click **"Enable"**

### 3. Cloud Messaging

- Already enabled when you get the VAPID key

## 📦 Deploy Firestore Rules

Once everything is set up:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

This deploys the security rules and indexes we've already created.

## ✅ Test It!

```bash
npm run dev
```

Open http://localhost:5173 and you should see:
- ✅ Auth page loads
- ✅ No Firebase warnings
- ✅ Can sign up/sign in
- ✅ Dashboard works after login

## 🆘 Need Help?

If you get stuck:
1. Check browser console (F12) for errors
2. Make sure all values in `.env` are correct
3. Verify services are enabled in Firebase Console
4. Check that Firestore database is created

## 📝 Quick Links

- **Project Settings:** https://console.firebase.google.com/project/household-chores-d8eae/settings/general
- **Authentication:** https://console.firebase.google.com/project/household-chores-d8eae/authentication/providers
- **Firestore:** https://console.firebase.google.com/project/household-chores-d8eae/firestore
- **Cloud Messaging:** https://console.firebase.google.com/project/household-chores-d8eae/settings/cloudmessaging

