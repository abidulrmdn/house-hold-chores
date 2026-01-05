# Quick Start Guide

## What You Have

A complete Progressive Web App for managing household chores with:
- ✅ Authentication (Google + Email)
- ✅ Routine creation with categories
- ✅ Swipe-to-complete tasks
- ✅ Streak tracking for missed tasks
- ✅ Multi-user support
- ✅ Push notifications setup
- ✅ Beautiful, responsive UI

## What You Need to Do

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Firebase (15 minutes)

1. Create Firebase project at https://console.firebase.google.com/
2. Enable Authentication (Email + Google)
3. Create Firestore database
4. Get Cloud Messaging VAPID key
5. Copy your Firebase config values

### 3. Configure Environment

1. Copy `.env.example` to `.env`
2. Fill in your Firebase values
3. Update `public/firebase-messaging-sw.js` with your config

### 4. Deploy Firestore Rules
```bash
npm install -g firebase-tools
firebase login
firebase init  # Select Firestore and Hosting
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Run Locally
```bash
npm run dev
```

### 6. Build & Deploy
```bash
npm run build
firebase deploy --only hosting
```

## Your App Will Be Live At

`https://your-project-id.web.app`

## Optional: Add PWA Icons

Create these images and place in `public/`:
- `pwa-192x192.png` (192x192px)
- `pwa-512x512.png` (512x512px)

Then rebuild and redeploy.

## Need Help?

- See `DEPLOYMENT.md` for detailed deployment steps
- See `README.md` for full documentation
- See `TECH_STACK.md` for architecture details

## All Free Services Used

- ✅ Firebase Authentication (Free)
- ✅ Firestore Database (Free tier: 50K reads/day)
- ✅ Firebase Hosting (Free: 10GB storage)
- ✅ Cloud Messaging (Free)
- ✅ GitHub (Free for public repos)

Perfect for a household app! 🎉

