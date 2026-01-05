# Household Routine Manager

A Progressive Web App (PWA) for managing household chores and routines with your family. Built with React, TypeScript, Firebase, and Tailwind CSS.

## Features

- ✅ **Routine Management**: Create periodic tasks (daily, weekly, bi-weekly, monthly)
- 📁 **Categories**: Organize routines by categories (e.g., Bathroom, Kitchen, etc.)
- 👥 **Multi-user Support**: Assign tasks to different household members
- 📱 **Swipe to Complete**: Easy swipe gesture to mark tasks as done
- 🔔 **Push Notifications**: Get notified about due tasks
- 📊 **Streak Tracking**: See how many times you've missed a task
- 📅 **Smart Views**: Filter by today, this week, or all tasks
- 🎨 **Beautiful UI**: Modern, responsive design with Tailwind CSS
- 📱 **PWA**: Install as an app on your device

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Backend**: Firebase
  - Authentication (Google + Email)
  - Firestore (Database)
  - Cloud Messaging (Push Notifications)
  - Hosting
- **PWA**: Vite PWA Plugin

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ and npm/yarn
- Firebase account (free tier works)

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable the following services:
   - **Authentication**: Enable Email/Password and Google sign-in
   - **Firestore Database**: Create database in production mode (we'll use rules)
   - **Cloud Messaging**: Enable for push notifications

4. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll down to "Your apps" and add a web app
   - Copy the Firebase configuration object

5. Get VAPID Key for notifications:
   - Go to Project Settings > Cloud Messaging
   - Under "Web configuration", generate a new key pair
   - Copy the key

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your Firebase configuration values in `.env`:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
```

3. Update `public/firebase-messaging-sw.js` with your Firebase config (same values)

### 5. Deploy Firestore Rules and Indexes

```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (select your project)
firebase init

# Deploy rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

### 6. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 7. Build for Production

```bash
npm run build
```

This creates a `dist` folder with optimized production files.

## Deployment to Firebase Hosting

### 1. Build the Project

```bash
npm run build
```

### 2. Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

Your app will be live at: `https://your-project-id.web.app`

## What You Need to Do

### To Make This Public and Published:

1. **Firebase Setup** (as described above)
   - Create Firebase project
   - Enable Authentication, Firestore, Cloud Messaging
   - Get your config values

2. **Environment Variables**
   - Fill in `.env` file with your Firebase config
   - Update `public/firebase-messaging-sw.js` with your config

3. **Firestore Rules & Indexes**
   - Deploy the rules and indexes using Firebase CLI
   - The rules are already configured in `firestore.rules`
   - Indexes are in `firestore.indexes.json`

4. **Build & Deploy**
   - Run `npm run build`
   - Deploy with `firebase deploy --only hosting`

5. **PWA Icons** (Optional but recommended)
   - Create `public/pwa-192x192.png` (192x192px)
   - Create `public/pwa-512x512.png` (512x512px)
   - These are referenced in the manifest

## Best Practices & Ideas

### Current Implementation:
- ✅ Swipe-to-complete UX
- ✅ Streak tracking for missed tasks
- ✅ Category organization
- ✅ Multi-user assignment
- ✅ Push notifications setup
- ✅ Responsive design

### Future Enhancements:
1. **Household Management**: Proper household creation/joining flow
2. **User Profiles**: View other household members' profiles
3. **Statistics**: Track completion rates, streaks, etc.
4. **Recurring Task Generation**: Automatically create next task when one is completed
5. **Notifications**: Schedule notifications for due tasks
6. **Offline Support**: Better offline functionality with service workers
7. **Dark Mode**: Theme toggle
8. **Task History**: View completed tasks history
9. **Reminders**: Custom reminder times before due date
10. **Task Templates**: Pre-defined routine templates

## Project Structure

```
household-routine-manager/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── store/           # Zustand state management
│   ├── firebase/        # Firebase configuration
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── firebase.json        # Firebase configuration
├── firestore.rules      # Firestore security rules
└── firestore.indexes.json # Firestore indexes
```

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
