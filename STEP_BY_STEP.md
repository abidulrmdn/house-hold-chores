# Step-by-Step: Setup → Test → Deploy

## Step 1: Get Firebase Config Values

**Open:** https://console.firebase.google.com/project/household-chores-d8eae/settings/general

1. Scroll to "Your apps"
2. Add web app if needed (click `</>` icon)
3. Copy these values from `firebaseConfig`:
   - `apiKey`
   - `authDomain` 
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
   - `measurementId` (optional)

**Get VAPID Key:** https://console.firebase.google.com/project/household-chores-d8eae/settings/cloudmessaging

## Step 2: Run Setup Script

```bash
./setup-firebase.sh
```

Enter the values when prompted.

**OR** share the values with me and I'll create the `.env` file for you!

## Step 3: Enable Services

- **Authentication:** Enable Email/Password + Google
- **Firestore:** Create database (Production mode)

## Step 4: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Step 5: Test Locally

```bash
npm run dev
```

Open http://localhost:5173 and test:
- ✅ Sign up with email
- ✅ Sign in
- ✅ Create household
- ✅ Create routine
- ✅ Complete task

## Step 6: Deploy to Production

```bash
npm run build
firebase deploy --only hosting
```

Your app will be live at: `https://household-chores-d8eae.web.app`

