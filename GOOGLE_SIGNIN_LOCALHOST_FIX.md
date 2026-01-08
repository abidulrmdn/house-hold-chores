# Google Sign-In Localhost Redirect Fix

## Problem
Google Sign-In completes authentication at the Firebase auth handler (`https://household-chores-d8eae.firebaseapp.com/__/auth/handler`), but then immediately tries to redirect to `localhost`, which fails on mobile devices because localhost is not accessible.

## Root Cause
Firebase Auth's redirect handler JavaScript code detects `window.location.origin` as `localhost` (because Capacitor serves the app locally), and tries to redirect back to localhost after processing the authentication. This happens before the deep link can properly trigger the app to process the redirect result.

## Root Cause
Firebase Auth in Capacitor apps detects `window.location.origin` (which is `localhost` in Capacitor) and uses that as the redirect URL instead of the Firebase auth domain from the config.

## Solution Applied

### 1. Code Changes
- ✅ Updated deep link listeners to process redirects **immediately** when Firebase auth handler URLs are detected
- ✅ Added handling for localhost redirect attempts (fallback)
- ✅ Made redirect result processing synchronous instead of delayed
- ✅ Added validation to ensure auth domain is correctly configured
- ✅ Added logging to debug redirect URLs
- ✅ Improved error handling for invalid auth domains
- ✅ Fixed TypeScript errors with Capacitor App plugin

### 2. How It Works Now
1. User taps "Sign in with Google"
2. Browser opens → User authenticates with Google
3. Google redirects to: `https://household-chores-d8eae.firebaseapp.com/__/auth/handler`
4. **Android intercepts this URL** via intent filter → App opens via deep link
5. **App immediately processes redirect result** via `getRedirectResult()` before Firebase tries to redirect to localhost
6. Authentication completes → User is signed in
7. If Firebase still tries to redirect to localhost, the listener catches it and processes the auth result

### 2. Configuration Requirements

#### Check Your `.env` File
Make sure `VITE_FIREBASE_AUTH_DOMAIN` is set correctly:

```env
VITE_FIREBASE_AUTH_DOMAIN=household-chores-d8eae.firebaseapp.com
```

**Important:** 
- Do NOT use `localhost` or `127.0.0.1`
- Do NOT use `demo.firebaseapp.com` (this is a placeholder)
- Use your actual Firebase project auth domain

#### Verify Google Cloud Console Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project: `household-chores-d8eae`
3. Navigate to **APIs & Services** → **Credentials**
4. Find your **Web application** OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, ensure you have:
   ```
   https://household-chores-d8eae.firebaseapp.com/__/auth/handler
   ```
6. **Remove** any `localhost` redirect URIs if present (they shouldn't be there for mobile apps)

## Testing

1. **Rebuild the app:**
   ```bash
   npm run build
   npm run cap:sync
   ```

2. **Check console logs** when signing in:
   - Look for: `"Auth domain: household-chores-d8eae.firebaseapp.com"`
   - Look for: `"Expected redirect URL: https://household-chores-d8eae.firebaseapp.com/__/auth/handler"`
   - Look for: `"Current window.location.origin: ..."` (this will show localhost, which is expected)

3. **Test the flow:**
   - Open the app
   - Tap "Sign in with Google"
   - Complete authentication
   - The redirect should go to Firebase auth domain, not localhost
   - App should open via deep link and sign you in

## Debugging

If redirect still goes to localhost:

1. **Check `.env` file:**
   ```bash
   cat .env | grep VITE_FIREBASE_AUTH_DOMAIN
   ```
   Should show: `VITE_FIREBASE_AUTH_DOMAIN=household-chores-d8eae.firebaseapp.com`

2. **Check build output:**
   - Rebuild: `npm run build`
   - The auth domain should be baked into the build

3. **Check Android logcat:**
   ```bash
   adb logcat | grep -i "auth\|redirect\|google"
   ```
   Look for the redirect URL being used

4. **Verify Google OAuth settings:**
   - Make sure the Firebase auth domain redirect URI is added
   - Make sure there are NO localhost redirect URIs

## Expected Behavior

✅ **Correct Flow:**
1. User taps "Sign in with Google"
2. Browser opens with Google sign-in
3. After authentication, Google redirects to: `https://household-chores-d8eae.firebaseapp.com/__/auth/handler`
4. Android intercepts this URL (via intent filter) → **App opens immediately**
5. **App processes redirect result immediately** via `getRedirectResult()` → **Authentication completes**
6. User is signed in ✅
7. If Firebase handler tries to redirect to localhost, it's caught and ignored

❌ **Previous Incorrect Flow:**
1. User taps "Sign in with Google"
2. Browser opens with Google sign-in
3. After authentication, Google redirects to: `https://household-chores-d8eae.firebaseapp.com/__/auth/handler`
4. Firebase handler processes auth → **Tries to redirect to localhost**
5. Browser tries to open localhost → **Fails on mobile**
6. Authentication fails ❌

## Key Fix
The critical change is processing the redirect result **immediately** when the Firebase auth handler URL is detected via deep link, before Firebase's JavaScript tries to redirect to localhost. The deep link listener now processes the auth result synchronously instead of with a delay.

## Files Modified

- `src/components/Auth.tsx` - Added auth domain validation and logging
- `src/App.tsx` - Fixed Capacitor App plugin imports
- `src/firebase/config.ts` - Added native app detection logging

## Next Steps

1. ✅ Verify `.env` has correct `VITE_FIREBASE_AUTH_DOMAIN`
2. ✅ Verify Google Cloud Console has Firebase auth domain redirect URI
3. ✅ Rebuild and test the app
4. ✅ Check console logs for redirect URL
5. ✅ Test Google Sign-In flow

If issues persist, check the console logs for the actual redirect URL being used and verify it matches the Firebase auth domain.

