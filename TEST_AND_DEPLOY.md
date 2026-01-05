# Test & Deploy Checklist

## ✅ Completed
- [x] Firebase config set up (.env file)
- [x] Service worker updated
- [x] Firestore rules deployed
- [x] Firestore indexes deployed

## 🔧 Required: Enable Services in Firebase Console

**Before testing, make sure these are enabled:**

### 1. Enable Authentication
**Link:** https://console.firebase.google.com/project/household-chores-d8eae/authentication/providers

- [ ] Enable **Email/Password**
- [ ] Enable **Google** (add support email)

### 2. Create Firestore Database
**Link:** https://console.firebase.google.com/project/household-chores-d8eae/firestore

- [ ] Click **"Create database"**
- [ ] Select **"Production mode"**
- [ ] Choose location
- [ ] Click **"Enable"**

## 🧪 Test Locally

The dev server should be running at: **http://localhost:5173**

**Test these features:**
1. ✅ App loads without errors
2. ✅ No Firebase warnings
3. ✅ Sign up with email/password
4. ✅ Sign in
5. ✅ Create household
6. ✅ Create routine
7. ✅ Create category
8. ✅ Swipe to complete task
9. ✅ View tasks by filter (Today, Week, My Tasks)

## 🚀 Deploy to Production

Once local testing works:

```bash
# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

**Your app will be live at:**
- https://household-chores-d8eae.web.app
- https://household-chores-d8eae.firebaseapp.com

## 🐛 Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Make sure `.env` file exists and has all values
- Restart dev server: `npm run dev`

### "Permission denied" errors
- Make sure Firestore database is created
- Verify rules are deployed: `firebase deploy --only firestore:rules`

### Authentication not working
- Verify Email/Password and Google are enabled in Console
- Check browser console for specific errors

