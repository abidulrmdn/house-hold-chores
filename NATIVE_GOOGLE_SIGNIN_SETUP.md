# Native Google Sign-In Setup Guide

## ✅ What's Changed

We've switched from web-based Firebase Auth redirect to **native Google Sign-In** for Android. This provides:
- ✅ No cross-domain storage issues
- ✅ Better native user experience
- ✅ More reliable authentication flow
- ✅ Works seamlessly with Firebase Auth

## 🔧 Setup Steps

### Step 1: Get Google Web Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `household-chores-d8eae`
3. Navigate to **APIs & Services** → **Credentials**
4. Find the **OAuth 2.0 Client ID** for **Web application** (not Android)
   - If you don't have one, click **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `Household Routine Manager Web`
   - Authorized JavaScript origins: Add your Firebase hosting URLs:
     - `https://household-chores-d8eae.web.app`
     - `https://household-chores-d8eae.firebaseapp.com`
   - Authorized redirect URIs: Add:
     - `https://household-chores-d8eae.firebaseapp.com/__/auth/handler`
     - `https://household-chores-d8eae.web.app/__/auth/handler`
5. Copy the **Client ID** (it looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

### Step 2: Add to Environment Variables

Add the web client ID to your `.env` file:

```bash
VITE_GOOGLE_WEB_CLIENT_ID=your-web-client-id-here.apps.googleusercontent.com
```

**Important:** This is the **Web** client ID, not the Android client ID. The Android client ID is automatically configured via `google-services.json`.

### Step 3: Rebuild and Sync

```bash
npm run build
npm run cap:sync
```

### Step 4: Build and Test

Build the app in Android Studio and test the Google Sign-In flow.

## 🧪 Testing

1. Open the app on your Android device
2. Click "Sign in with Google"
3. You should see the native Google Sign-In dialog (not a browser)
4. Select your Google account
5. The app should sign you in automatically

## 🔍 Troubleshooting

### "Google Sign-In failed: No authentication data received"
- Make sure you've added the web client ID to `.env`
- Rebuild and sync: `npm run build && npm run cap:sync`

### "Google Sign-In failed: No ID token received"
- Check that Google Sign-In is enabled in Firebase Console
- Verify the web client ID is correct
- Make sure you're using the **Web** client ID, not Android

### Sign-in dialog doesn't appear
- Check logcat for errors
- Verify the plugin is installed: `npm list @codetrix-studio/capacitor-google-auth`
- Make sure `google-services.json` is in `android/app/`

## 📝 Notes

- **Web browsers** still use the popup method (`signInWithPopup`)
- **Android/iOS** now use native Google Sign-In
- The native sign-in returns Google credentials that are converted to Firebase credentials
- No more cross-domain storage issues!

## 🔗 Useful Links

- [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
- [Firebase Console - Authentication](https://console.firebase.google.com/project/household-chores-d8eae/authentication/providers)
- [Capacitor Google Auth Plugin](https://github.com/CodetrixStudio/CapacitorGoogleAuth)

