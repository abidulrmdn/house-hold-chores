# Next Steps After Setup Script

## ✅ What's Done
- `.env` file created with Firebase config
- Service worker updated

## 🔧 Step 1: Enable Firebase Services

### Enable Authentication
1. Go to: https://console.firebase.google.com/project/household-chores-d8eae/authentication/providers
2. Click on **Email/Password**
   - Enable it
   - Click **Save**
3. Click on **Google**
   - Enable it
   - Add your support email
   - Click **Save**

### Create Firestore Database
1. Go to: https://console.firebase.google.com/project/household-chores-d8eae/firestore
2. Click **"Create database"**
3. Select **"Start in production mode"** (we'll deploy rules)
4. Choose a location (closest to you)
5. Click **"Enable"**

## 📦 Step 2: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

This deploys the security rules and indexes.

## 🧪 Step 3: Test Locally

```bash
npm run dev
```

Then:
1. Open http://localhost:5173
2. You should see the auth page (no warnings!)
3. Sign up with email/password
4. Create a household
5. Create a routine
6. Test swipe to complete

## 🚀 Step 4: Deploy to Production

```bash
# Build the app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your app will be live at:
- https://household-chores-d8eae.web.app
- https://household-chores-d8eae.firebaseapp.com

## ✅ Verification Checklist

- [ ] Authentication enabled (Email + Google)
- [ ] Firestore database created
- [ ] Firestore rules deployed
- [ ] App works locally
- [ ] Can sign up/sign in
- [ ] Can create routines
- [ ] App deployed to production

