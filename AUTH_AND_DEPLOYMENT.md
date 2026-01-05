# Authentication & Deployment Guide

## ✅ Authentication - YES, We Have It!

The app includes **full authentication** with two methods:

### 1. **Email/Password Authentication**
- Sign up with email and password
- Sign in with existing credentials
- Secure password handling via Firebase

### 2. **Google Sign-In**
- One-click Google authentication
- Uses Firebase Google Auth Provider
- Automatically creates user profile

### Authentication Flow:
1. User lands on auth page if not logged in
2. Can choose Email/Password or Google sign-in
3. After authentication, user data is stored in Firestore
4. User is redirected to Dashboard
5. Session persists across page refreshes

**Files:**
- `src/components/Auth.tsx` - Authentication UI component
- `src/firebase/config.ts` - Firebase auth configuration
- `src/store/useAuthStore.ts` - Auth state management

---

## 🚀 Running Locally

### Prerequisites:
1. Node.js 18+ installed
2. Firebase project created (for full functionality)

### Steps:

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Set up Firebase config**:
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration values
   - See `DEPLOYMENT.md` for detailed Firebase setup

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   - The app will be available at `http://localhost:5173`
   - Vite will show you the exact URL in the terminal

### What You'll See:

**Without Firebase Config:**
- App will load but Firebase will show errors
- UI will render but authentication won't work
- You'll see the auth page

**With Firebase Config:**
- Full authentication working
- Can sign up/sign in
- Dashboard with task management
- All features functional

### Testing Locally:
```bash
# Development server (hot reload)
npm run dev

# Build for production (test build)
npm run build

# Preview production build
npm run preview
```

---

## 📦 Deploy to Production

### Option 1: Firebase Hosting (Recommended - FREE)

#### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

#### Step 2: Login to Firebase
```bash
firebase login
```

#### Step 3: Initialize Firebase in Your Project
```bash
firebase init
```

Select:
- ✅ **Firestore**: Configure security rules and indexes
- ✅ **Hosting**: Configure files for Firebase Hosting

When prompted:
- Select your Firebase project
- Use default file names (`firestore.rules`, `firestore.indexes.json`)
- Public directory: **`dist`**
- Configure as single-page app: **Yes**
- Set up automatic builds: **No** (for now)

#### Step 4: Deploy Firestore Rules & Indexes
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

This ensures your database security is set up correctly.

#### Step 5: Build Your App
```bash
npm run build
```

This creates an optimized `dist` folder.

#### Step 6: Deploy to Hosting
```bash
firebase deploy --only hosting
```

#### Step 7: Your App is Live! 🎉
Your app will be available at:
- `https://your-project-id.web.app`
- `https://your-project-id.firebaseapp.com`

### Option 2: Other Hosting Services

#### Vercel (Also FREE):
```bash
npm install -g vercel
vercel
```

#### Netlify (Also FREE):
```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### GitHub Pages:
1. Build: `npm run build`
2. Deploy `dist` folder to GitHub Pages
3. Configure base path in `vite.config.ts`

---

## 🔄 Updating Production

After making changes:

```bash
# 1. Build
npm run build

# 2. Deploy
firebase deploy --only hosting
```

Or set up CI/CD:
- GitHub Actions
- Firebase GitHub integration
- Automatic deployments on push

---

## 🔐 Firebase Setup Checklist

Before deploying, make sure:

- [ ] Firebase project created
- [ ] Authentication enabled (Email + Google)
- [ ] Firestore database created
- [ ] Cloud Messaging enabled (for notifications)
- [ ] `.env` file configured with Firebase values
- [ ] `public/firebase-messaging-sw.js` updated with config
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed

---

## 📱 PWA Installation

Once deployed, users can:

1. **On Mobile:**
   - Open the app in browser
   - Tap "Add to Home Screen"
   - App installs like a native app

2. **On Desktop:**
   - Look for install prompt in browser
   - Or use browser menu: "Install App"

---

## 🆓 Free Tier Limits

All services used are **FREE**:

- **Firebase Authentication**: Unlimited
- **Firestore**: 50K reads, 20K writes/day (plenty for household use)
- **Firebase Hosting**: 10 GB storage, 360 MB/day transfer
- **Cloud Messaging**: Unlimited

Perfect for a household app! 🎉

---

## 🐛 Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Make sure `.env` file exists and has all Firebase config values
- Restart dev server after adding `.env`

### "Firestore permission denied"
- Deploy Firestore rules: `firebase deploy --only firestore:rules`
- Check rules in `firestore.rules`

### Build fails
- Check all environment variables are set
- Run `npm install` again
- Clear `node_modules` and reinstall if needed

### Authentication not working
- Verify Email/Password and Google are enabled in Firebase Console
- Check `VITE_FIREBASE_AUTH_DOMAIN` matches your project

---

## 📚 Additional Resources

- **Quick Start**: See `QUICK_START.md`
- **Detailed Deployment**: See `DEPLOYMENT.md`
- **Tech Stack**: See `TECH_STACK.md`
- **Full README**: See `README.md`

