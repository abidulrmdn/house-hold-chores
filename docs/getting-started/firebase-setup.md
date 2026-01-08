# Firebase Setup Guide

This guide will help you set up Firebase for the Household Routine Manager application.

## Overview

The app uses Firebase for:
- **Authentication** (Email/Password + Google Sign-in)
- **Firestore Database** (storing routines, tasks, and household data)
- **Cloud Messaging** (push notifications)
- **Hosting** (deploying the web app)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select an existing project
3. Enter a project name (e.g., "household-routine-manager")
4. Optionally disable Google Analytics (to keep it free)
5. Click **"Create project"**

## Step 2: Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ → **Project Settings**
2. Scroll down to **"Your apps"** section
3. If you don't have a web app yet:
   - Click the **`</>`** (Web) icon
   - Register app nickname: "Web App"
   - Click **Register app**
4. Copy the `firebaseConfig` object values

You'll see something like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-XXXXXXXXXX"
};
```

## Step 3: Get VAPID Key for Notifications

1. In Firebase Console → **Project Settings**
2. Go to **Cloud Messaging** tab
3. Under **"Web configuration"**, click **"Generate key pair"**
4. Copy the key (this is your VAPID key)

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase values in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
   ```

3. Update `public/firebase-messaging-sw.js`:
   - Replace the `firebaseConfig` object with your actual values
   - Use the same values from your `.env` file

## Step 5: Enable Required Services

### Enable Authentication

1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click **Save**
3. Enable **Google**:
   - Click on "Google"
   - Toggle "Enable"
   - Add your support email
   - Click **Save**

### Create Firestore Database

1. Go to **Firestore Database**
2. Click **"Create database"**
3. Start in **Production mode** (we'll deploy rules)
4. Choose a location (closest to your users)
5. Click **"Enable"**

### Cloud Messaging

Cloud Messaging is automatically enabled when you generate the VAPID key.

## Step 6: Deploy Firestore Rules and Indexes

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done):
   ```bash
   firebase init
   ```
   Select:
   - ✅ Firestore: Configure security rules and indexes files
   - ✅ Hosting: Configure files for Firebase Hosting
   - Use default file names
   - Use `dist` as your public directory
   - Configure as single-page app: **Yes**

4. **Deploy rules and indexes**:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

## Step 7: Verify Setup

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser**:
   Navigate to `http://localhost:5173`

3. **Test authentication**:
   - You should see the auth page (no warnings)
   - Try signing up with email/password
   - Try signing in with Google

4. **Test database**:
   - After signing in, create a household
   - Create a routine
   - Verify data appears in Firestore Console

## Quick Links

- **Firebase Console**: https://console.firebase.google.com/
- **Project Settings**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/settings/general
- **Authentication**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/authentication/providers
- **Firestore**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore
- **Cloud Messaging**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/settings/cloudmessaging

## Troubleshooting

### Firebase Not Configured Warning

If you see a warning banner:
- Check that `.env` file exists and has all values filled
- Verify values match your Firebase project
- Restart the dev server after creating/updating `.env`

### Authentication Not Working

- Verify Email/Password and Google sign-in are enabled in Firebase Console
- Check that `VITE_FIREBASE_AUTH_DOMAIN` matches your project
- Check browser console for errors

### Firestore Errors

- Make sure Firestore database is created
- Verify rules are deployed: `firebase deploy --only firestore:rules`
- Check Firestore Console for any error messages

### Notifications Not Working

- Verify VAPID key is set in `.env`
- Update `public/firebase-messaging-sw.js` with your Firebase config
- Check browser console for errors
- Make sure notification permissions are granted

## Free Tier Limits

Firebase free tier (Spark plan) includes:
- **Authentication**: Unlimited
- **Firestore**: 50K reads, 20K writes, 20K deletes per day
- **Hosting**: 10 GB storage, 360 MB/day transfer
- **Cloud Messaging**: Unlimited

This should be sufficient for a small household app. Monitor usage in Firebase Console.

## Security Notes

- Never commit `.env` file to git (it's in `.gitignore`)
- Firestore rules are deployed and protect your data
- Only authenticated users can access data
- Users can only modify their own data and household data

## Next Steps

- [Deploy to Production](../deployment/README.md)
- [Set up Android App](../android/README.md)
- [Configure Notifications](../features/notifications.md)

