# Deployment Guide

## Quick Start Deployment

### Step 1: Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Enter project name (e.g., "household-routine-manager")
   - Disable Google Analytics (optional, to keep it free)
   - Click "Create project"

2. **Enable Authentication**
   - Go to Authentication > Sign-in method
   - Enable "Email/Password"
   - Enable "Google" (add your support email)

3. **Create Firestore Database**
   - Go to Firestore Database
   - Click "Create database"
   - Start in **production mode** (we'll deploy rules)
   - Choose a location (closest to your users)
   - Click "Enable"

4. **Enable Cloud Messaging**
   - Go to Project Settings > Cloud Messaging
   - Under "Web configuration", click "Generate key pair"
   - Copy the key (this is your VAPID key)

### Step 2: Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register app (nickname: "Web App")
5. Copy the `firebaseConfig` object values

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase values in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   VITE_FIREBASE_VAPID_KEY=your-vapid-key-here
   ```

3. Update `public/firebase-messaging-sw.js`:
   - Replace the `firebaseConfig` object with your actual values
   - Use the same values from your `.env` file

### Step 4: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 5: Login to Firebase

```bash
firebase login
```

### Step 6: Initialize Firebase in Project

```bash
firebase init
```

Select:
- ✅ Firestore: Configure security rules and indexes files
- ✅ Hosting: Configure files for Firebase Hosting

When prompted:
- Select your Firebase project
- Use default file names (firestore.rules, firestore.indexes.json)
- Use `dist` as your public directory
- Configure as single-page app: **Yes**
- Set up automatic builds: **No** (for now)

### Step 7: Deploy Firestore Rules and Indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

This ensures your database security rules and indexes are set up correctly.

### Step 8: Build the Project

```bash
npm install
npm run build
```

This creates the `dist` folder with production-ready files.

### Step 9: Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

### Step 10: Access Your App

Your app is now live at:
- `https://your-project-id.web.app`
- `https://your-project-id.firebaseapp.com`

## Updating the App

After making changes:

```bash
npm run build
firebase deploy --only hosting
```

## PWA Icons (Optional but Recommended)

To add custom icons:

1. Create two PNG images:
   - `public/pwa-192x192.png` (192x192 pixels)
   - `public/pwa-512x512.png` (512x512 pixels)

2. Rebuild and redeploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## Testing Locally

```bash
npm run dev
```

Visit `http://localhost:5173`

## Troubleshooting

### Firestore Index Errors

If you see index errors, Firebase will provide a link to create the missing indexes. Click the link and create them.

### Authentication Not Working

- Make sure Email/Password and Google sign-in are enabled in Firebase Console
- Check that your `VITE_FIREBASE_AUTH_DOMAIN` matches your project

### Notifications Not Working

- Make sure you've added the VAPID key to `.env`
- Update `public/firebase-messaging-sw.js` with your Firebase config
- Check browser console for errors
- Make sure you've granted notification permissions

### Build Errors

- Make sure all environment variables are set
- Check that all dependencies are installed: `npm install`
- Clear node_modules and reinstall if needed: `rm -rf node_modules && npm install`

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

