# Quick Firebase Setup - household-chores-d8eae

## 🚀 Quick Steps

### 1. Get Firebase Config (2 minutes)

**Go to:** https://console.firebase.google.com/project/household-chores-d8eae/settings/general

1. Scroll to **"Your apps"** section
2. If no web app exists, click **`</>`** icon to add one
3. Copy these values from the `firebaseConfig`:

```javascript
apiKey: "AIza..."           → VITE_FIREBASE_API_KEY
authDomain: "..."           → VITE_FIREBASE_AUTH_DOMAIN (usually: household-chores-d8eae.firebaseapp.com)
projectId: "..."            → VITE_FIREBASE_PROJECT_ID (household-chores-d8eae)
storageBucket: "..."        → VITE_FIREBASE_STORAGE_BUCKET (usually: household-chores-d8eae.appspot.com)
messagingSenderId: "..."    → VITE_FIREBASE_MESSAGING_SENDER_ID
appId: "..."                → VITE_FIREBASE_APP_ID
measurementId: "..."        → VITE_FIREBASE_MEASUREMENT_ID (optional)
```

### 2. Get VAPID Key (1 minute)

**Go to:** https://console.firebase.google.com/project/household-chores-d8eae/settings/cloudmessaging

1. Under **"Web configuration"**
2. Click **"Generate key pair"** (if not already generated)
3. Copy the key → `VITE_FIREBASE_VAPID_KEY`

### 3. Enable Services (2 minutes)

#### Authentication:
**Go to:** https://console.firebase.google.com/project/household-chores-d8eae/authentication/providers

- ✅ Enable **Email/Password**
- ✅ Enable **Google** (add support email)

#### Firestore:
**Go to:** https://console.firebase.google.com/project/household-chores-d8eae/firestore

- Click **Create database**
- Start in **Production mode**
- Choose location
- Click **Enable**

### 4. Create .env File

Once you have all the values, I'll help you create the `.env` file!

Or create it manually:
```bash
cp .env.example .env
# Then edit .env with your values
```

### 5. Update Service Worker

Update `public/firebase-messaging-sw.js` with your Firebase config.

### 6. Deploy Rules

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 7. Test!

```bash
npm run dev
```

Open http://localhost:5173 and you should see the auth page working!

---

## 📋 What I've Already Done

✅ Created `.firebaserc` with your project ID
✅ Set Firebase project to `household-chores-d8eae`
✅ Firebase config files are ready
✅ Firestore rules and indexes are ready

## 🎯 What You Need to Do

1. Get Firebase config values (from Console)
2. Get VAPID key
3. Enable Authentication & Firestore
4. Create `.env` file with your values
5. Update service worker

**Then tell me when you have the values and I'll help you set them up!**

