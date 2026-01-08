# Verify Google Cloud Console Redirect URI Configuration

## Critical: This is likely the root cause!

The redirect URI configuration in Google Cloud Console determines where Google OAuth can redirect after authentication. If it's not configured correctly, Firebase Auth will redirect to localhost or fail.

## Step-by-Step Verification

### Step 1: Open Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. **Select your Firebase project**: `household-chores-d8eae`
3. Navigate to: **APIs & Services** → **Credentials**

### Step 2: Find Your OAuth 2.0 Client IDs

You should see multiple OAuth clients:
- **Web application** (for Firebase web app) ← **THIS IS THE ONE WE NEED**
- **Android** (if you added Android app to Firebase)
- **iOS** (if you added iOS app to Firebase)

### Step 3: Edit the Web Application OAuth Client

1. **Click on the "Web application" OAuth client**
2. Look at the **"Authorized redirect URIs"** section

### Step 4: Verify Required Redirect URIs

**You MUST have these redirect URIs configured:**

#### Required URI #1: Firebase Auth Handler
```
https://household-chores-d8eae.firebaseapp.com/__/auth/handler
```

#### Required URI #2: Firebase Web App Domain (alternative)
```
https://household-chores-d8eae.web.app/__/auth/handler
```

### Step 5: Check for Problematic URIs

**Remove these if present (they cause localhost redirects):**
- ❌ `http://localhost:5173/__/auth/handler`
- ❌ `http://localhost/__/auth/handler`
- ❌ `https://localhost/__/auth/handler`
- ❌ Any URI containing `localhost` or `127.0.0.1`

### Step 6: Add Missing URIs

If the Firebase domain URIs are missing:

1. Click **"+ ADD URI"**
2. Add: `https://household-chores-d8eae.firebaseapp.com/__/auth/handler`
3. Click **"+ ADD URI"** again
4. Add: `https://household-chores-d8eae.web.app/__/auth/handler`
5. Click **"SAVE"**

### Step 7: Wait for Propagation

- Changes can take **2-5 minutes** to propagate
- Clear app cache after changes: `adb shell pm clear com.household.routinemanager`

## Quick Link to OAuth Settings

**Direct link to your project's OAuth settings:**
https://console.cloud.google.com/apis/credentials?project=household-chores-d8eae

## What Should Be Configured

### ✅ Correct Configuration:

**Authorized redirect URIs:**
```
https://household-chores-d8eae.firebaseapp.com/__/auth/handler
https://household-chores-d8eae.web.app/__/auth/handler
```

**Authorized JavaScript origins:**
```
https://household-chores-d8eae.firebaseapp.com
https://household-chores-d8eae.web.app
```

### ❌ Incorrect Configuration (causes localhost redirect):

**Authorized redirect URIs:**
```
http://localhost:5173/__/auth/handler  ← REMOVE THIS
https://localhost/__/auth/handler      ← REMOVE THIS
```

## Why This Matters

1. **Google OAuth checks redirect URI**: When Firebase Auth redirects after authentication, Google checks if the redirect URI is authorized
2. **If not authorized**: Google rejects the redirect or redirects to a default (often localhost)
3. **If localhost is authorized**: Google will redirect to localhost, which fails on mobile

## Testing After Fix

1. **Update redirect URIs** in Google Cloud Console
2. **Wait 2-5 minutes** for propagation
3. **Clear app data**: `adb shell pm clear com.household.routinemanager`
4. **Rebuild app**: `cd android && ./gradlew clean assembleDebug`
5. **Test Google Sign-In**

## Expected Behavior After Fix

1. User taps "Sign in with Google"
2. Browser opens → User authenticates
3. Google redirects to: `https://household-chores-d8eae.firebaseapp.com/__/auth/handler`
4. Android intercepts URL → App opens via deep link
5. Authentication completes → User signed in ✅

## Troubleshooting

**If redirect still goes to localhost:**

1. **Double-check redirect URIs** - Make sure Firebase domain URIs are added
2. **Remove localhost URIs** - They shouldn't be there for mobile apps
3. **Check project selection** - Make sure you're editing the correct project
4. **Wait longer** - OAuth changes can take up to 10 minutes
5. **Clear browser cache** - The browser might cache old OAuth settings

**If redirect goes to web instead of app:**

1. **Check AndroidManifest.xml** - Intent filters should catch Firebase domain URLs
2. **Verify deep linking** - Test by opening `https://household-chores-d8eae.firebaseapp.com/__/auth/handler` in browser
3. **Check app state listeners** - Make sure `appUrlOpen` listener is registered

## Alternative: Quick Check via Firebase Console

1. Go to: https://console.firebase.google.com/project/household-chores-d8eae/authentication/providers
2. Click on **Google** provider
3. Look for **"Open Google Cloud Console"** link
4. This takes you directly to the OAuth client settings

