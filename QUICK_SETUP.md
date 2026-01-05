# Quick Setup Guide

## 🚀 Fast Track: Setup → Test → Deploy

### 1️⃣ Get Firebase Config (2 min)

**Open this link and copy the values:**
https://console.firebase.google.com/project/household-chores-d8eae/settings/general

Look for the `firebaseConfig` object in "Your apps" section.

**Get VAPID Key:**
https://console.firebase.google.com/project/household-chores-d8eae/settings/cloudmessaging

### 2️⃣ Run Setup Script

```bash
./setup-firebase.sh
```

Enter the values when prompted. The script will:
- ✅ Create `.env` file
- ✅ Update service worker
- ✅ Set everything up

### 3️⃣ Enable Services (2 min)

**Authentication:**
https://console.firebase.google.com/project/household-chores-d8eae/authentication/providers
- Enable Email/Password
- Enable Google

**Firestore:**
https://console.firebase.google.com/project/household-chores-d8eae/firestore
- Click "Create database"
- Production mode
- Choose location
- Enable

### 4️⃣ Deploy Rules

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 5️⃣ Test Locally

```bash
npm run dev
```

Open http://localhost:5173

**Test:**
- Sign up with email
- Sign in
- Create household
- Create routine
- Swipe to complete task

### 6️⃣ Deploy to Production

```bash
npm run build
firebase deploy --only hosting
```

**Your app:** https://household-chores-d8eae.web.app

---

## 🆘 Alternative: Manual Setup

If you prefer, share your Firebase config values with me and I'll create the `.env` file for you!

