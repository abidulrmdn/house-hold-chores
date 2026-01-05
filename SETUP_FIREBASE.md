# Firebase Setup Guide for Your Project

## Your Project ID
**`household-chores-d8eae`**

## Step 1: Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **household-chores-d8eae**
3. Click the gear icon ⚙️ → **Project Settings**
4. Scroll down to **"Your apps"** section
5. If you don't have a web app yet:
   - Click the **`</>`** (Web) icon
   - Register app nickname: "Web App"
   - Click **Register app**
6. Copy the `firebaseConfig` object values

You'll see something like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "household-chores-d8eae.firebaseapp.com",
  projectId: "household-chores-d8eae",
  storageBucket: "household-chores-d8eae.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-XXXXXXXXXX"
};
```

## Step 2: Get VAPID Key for Notifications

1. In Firebase Console → Project Settings
2. Go to **Cloud Messaging** tab
3. Under **"Web configuration"**, click **"Generate key pair"**
4. Copy the key (this is your VAPID key)

## Step 3: Enable Required Services

### Enable Authentication:
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** (add your support email)

### Enable Firestore:
1. Go to **Firestore Database**
2. Click **Create database**
3. Start in **Production mode** (we'll deploy rules)
4. Choose a location (closest to you)
5. Click **Enable**

### Enable Cloud Messaging:
- Already enabled when you get the VAPID key

## Step 4: Create .env File

I'll help you create this once you have the config values!

## Step 5: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Next Steps

Once you have your Firebase config values, I'll help you:
1. Create the `.env` file
2. Update the service worker
3. Test the connection
4. Deploy everything

