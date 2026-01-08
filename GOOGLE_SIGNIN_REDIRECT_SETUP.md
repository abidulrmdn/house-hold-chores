# Google Sign-In Redirect URI Setup for Android

## ✅ Recent Fixes

The app now includes proper Google Sign-In redirect handling:
- ✅ Installed `@capacitor/app` plugin for deep link handling
- ✅ Added App URL listeners to detect Firebase Auth redirects
- ✅ Added App state change listeners to handle redirects when app resumes
- ✅ Improved error handling for redirect flows
- ✅ AndroidManifest.xml configured with proper intent filters

## Why This Is Needed

When using Google Sign-In with `signInWithRedirect` in a Capacitor Android app, Firebase Auth redirects back to your app after authentication. You need to configure authorized redirect URIs so Google knows it's safe to redirect to your app.

## Step-by-Step Instructions

### Step 1: Go to Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're logged in with the same Google account used for Firebase
3. **Select your Firebase project** from the project dropdown at the top
   - Your project ID should be: `household-chores-d8eae` (or whatever your Firebase project ID is)

### Step 2: Navigate to Credentials

1. In the left sidebar, click **"APIs & Services"**
2. Click **"Credentials"**

### Step 3: Find Your OAuth 2.0 Client ID

1. Scroll down to the **"OAuth 2.0 Client IDs"** section
2. You should see multiple OAuth clients:
   - One for **Web application** (for your web app)
   - One for **Android** (if you've added Android app to Firebase)
   - One for **iOS** (if you've added iOS app to Firebase)

### Step 4: Edit the Web Application OAuth Client

1. **Click on the Web application OAuth client** (it should have your Firebase project name)
2. This opens the edit page

### Step 5: Add Authorized Redirect URIs

1. Scroll down to the **"Authorized redirect URIs"** section
2. Click **"+ ADD URI"** button
3. Add this URI:

   **Firebase Auth redirect handler:**
   ```
   https://YOUR_AUTH_DOMAIN/__/auth/handler
   ```
   Replace `YOUR_AUTH_DOMAIN` with your Firebase auth domain (e.g., `household-chores-d8eae.firebaseapp.com`)

   **Example:**
   ```
   https://household-chores-d8eae.firebaseapp.com/__/auth/handler
   ```

   **Important:** Google OAuth only accepts `http://` or `https://` schemes. The custom URL scheme (`com.household.routinemanager://`) is handled automatically by Capacitor and Firebase - you don't need to add it here.

4. Click **"SAVE"** at the bottom

### Step 6: Verify Your Auth Domain

To find your exact auth domain:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Settings** tab
4. Scroll to **"Authorized domains"** section
5. Your auth domain will be listed there (usually `your-project-id.firebaseapp.com`)

## Alternative: Quick Link Method

If you can't find the OAuth client in Google Cloud Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Look for a link that says **"Open Google Cloud Console"** or **"Manage OAuth clients"**
6. This will take you directly to the OAuth client settings

## What the URI Does

- **`https://your-project.firebaseapp.com/__/auth/handler`**: This is Firebase's standard redirect handler. When Google redirects here after authentication, Firebase processes it and then redirects to your app using Capacitor's deep linking mechanism.

**Note:** The custom URL scheme (`com.household.routinemanager://`) is configured in your `AndroidManifest.xml` and `capacitor.config.ts`. Capacitor automatically handles the conversion from the Firebase redirect to your app's custom scheme - you don't need to add it to Google OAuth settings.

## How It Works Now

The app now handles Google Sign-In redirects automatically:

1. **User clicks "Sign in with Google"** → App calls `signInWithRedirect()`
2. **Browser opens** → User authenticates with Google
3. **Firebase redirects** → Uses `https://your-project.firebaseapp.com/__/auth/handler`
4. **Android intercepts** → Intent filter catches the redirect
5. **App resumes** → Capacitor App plugin detects the URL
6. **Auth completes** → `getRedirectResult()` processes the authentication
7. **User signed in** → Auth state updates and user is redirected to Dashboard

## Testing

After adding the redirect URIs:

1. Build your Android app:
   ```bash
   npm run build
   npm run cap:sync
   ```

2. Install the app on a device or emulator

3. Try signing in with Google:
   - It should open a browser
   - After selecting your Google account, it should redirect back to your app
   - You should be signed in
   - Check console logs for "Google Sign-In redirect successful" message

## Troubleshooting

**If redirect still doesn't work:**

1. **Check AndroidManifest.xml**: Make sure the intent filter is correctly configured (we already added this)
   - Verify the Firebase domain matches your project: `household-chores-d8eae.firebaseapp.com`
   - Check that both `.firebaseapp.com` and `.web.app` domains are included

2. **Verify app ID**: Make sure the redirect URI matches your app ID in `capacitor.config.ts`:
   ```typescript
   appId: 'com.household.routinemanager'
   ```

3. **Check Firebase project**: Make sure you're editing the OAuth client for the correct Firebase project

4. **Verify Google Cloud Console**: Ensure the redirect URI is added to the **Web application** OAuth client (not Android client)

5. **Check console logs**: Look for these messages in Android logcat or Chrome DevTools:
   - `"Initiating Google Sign-In redirect for native app"`
   - `"App opened with URL: ..."`
   - `"Google Sign-In redirect successful: ..."`
   - If you see errors, they'll help identify the issue

6. **Wait a few minutes**: Changes to OAuth settings can take a few minutes to propagate

7. **Clear app data**: On Android, try clearing the app's data and cache, then test again:
   ```bash
   adb shell pm clear com.household.routinemanager
   ```

8. **Rebuild the app**: After making changes, rebuild and reinstall:
   ```bash
   npm run build
   npm run cap:sync
   # Then rebuild in Android Studio
   ```

9. **Check Capacitor App plugin**: Verify the plugin is installed:
   ```bash
   npm list @capacitor/app
   ```
   Should show version 8.0.0 or higher

10. **Test deep linking manually**: Try opening this URL in Android browser to test if the app opens:
    ```
    https://household-chores-d8eae.firebaseapp.com/__/auth/handler
    ```
    The app should open (even if auth fails, it confirms deep linking works)

## Notes

- The redirect URIs are case-sensitive
- Make sure there are no trailing slashes (except for the custom URL scheme which needs `://`)
- You can add multiple redirect URIs - add all that apply to your setup

