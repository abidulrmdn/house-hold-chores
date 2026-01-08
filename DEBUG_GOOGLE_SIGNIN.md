# Debugging Google Sign-In Localhost Redirect Issue

## How to Debug

### Step 1: Enable Debug Logging

The code now includes extensive debug logging. All logs are prefixed with `[AUTH DEBUG]` for easy filtering.

### Step 2: View Logs in Android Studio

1. **Open Android Studio**
2. **Connect your device or start an emulator**
3. **Open Logcat** (View → Tool Windows → Logcat)
4. **Filter logs** by typing: `AUTH DEBUG`

### Step 3: Test the Flow

1. **Clear app data** (to start fresh):
   ```bash
   adb shell pm clear com.household.routinemanager
   ```

2. **Install and run the app**

3. **Tap "Sign in with Google"**

4. **Watch the logs** - You should see:
   ```
   [AUTH DEBUG] ===== handleGoogleAuth called =====
   [AUTH DEBUG] ===== Native app Google Sign-In =====
   [AUTH DEBUG] Auth domain: household-chores-d8eae.firebaseapp.com
   [AUTH DEBUG] Expected redirect URL: https://household-chores-d8eae.firebaseapp.com/__/auth/handler
   [AUTH DEBUG] Current window.location.origin: https://localhost
   [AUTH DEBUG] Calling signInWithRedirect...
   ```

5. **After authentication**, you should see:
   ```
   [AUTH DEBUG] ===== appUrlOpen event fired =====
   [AUTH DEBUG] Event URL: https://household-chores-d8eae.firebaseapp.com/__/auth/handler?...
   [AUTH DEBUG] ✅ Firebase Auth redirect detected!
   [AUTH DEBUG] Processing redirect result immediately...
   [AUTH DEBUG] ===== Starting handleRedirectResult =====
   [AUTH DEBUG] ✅ Google Sign-In redirect successful!
   ```

### Step 4: Check for Issues

Look for these patterns in the logs:

#### ✅ Success Pattern:
```
[AUTH DEBUG] ✅ Firebase Auth redirect detected!
[AUTH DEBUG] ✅ Google Sign-In redirect successful!
```

#### ❌ Problem Pattern 1: No appUrlOpen Event
If you don't see `appUrlOpen` event:
- **Issue**: Deep link not working
- **Check**: AndroidManifest.xml intent filters
- **Solution**: Verify intent filters match Firebase domain

#### ❌ Problem Pattern 2: Localhost Redirect
If you see:
```
[AUTH DEBUG] ⚠️ Localhost redirect detected!
[AUTH DEBUG] URL: http://localhost:5173/...
```
- **Issue**: Firebase is redirecting to localhost
- **Check**: `.env` file has correct `VITE_FIREBASE_AUTH_DOMAIN`
- **Solution**: Rebuild app after fixing `.env`

#### ❌ Problem Pattern 3: No Redirect Result
If you see:
```
[AUTH DEBUG] No redirect result found
```
- **Issue**: `getRedirectResult()` not finding the auth result
- **Possible causes**:
  - Redirect happened but result wasn't stored
  - Timing issue - Firebase cleared the result
  - Wrong redirect URL configured

## Common Issues & Solutions

### Issue 1: `.env` File Not Set Correctly

**Check:**
```bash
cat .env | grep VITE_FIREBASE_AUTH_DOMAIN
```

**Should show:**
```
VITE_FIREBASE_AUTH_DOMAIN=household-chores-d8eae.firebaseapp.com
```

**If wrong:**
1. Edit `.env` file
2. Set correct auth domain
3. Rebuild: `npm run build && npm run cap:sync`

### Issue 2: Google Cloud Console Redirect URI

**Check:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Find your **Web application** OAuth client
4. Check **Authorized redirect URIs**

**Should include:**
```
https://household-chores-d8eae.firebaseapp.com/__/auth/handler
```

**Should NOT include:**
```
http://localhost:5173/__/auth/handler
```

### Issue 3: AndroidManifest Intent Filters

**Check:** `android/app/src/main/AndroidManifest.xml`

**Should have:**
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data 
        android:scheme="https"
        android:host="household-chores-d8eae.firebaseapp.com" />
</intent-filter>
```

### Issue 4: Timing Issue

If redirect result is cleared before processing:

**Try:**
1. Increase delay in `appStateChange` listener
2. Process redirect result immediately in `appUrlOpen`
3. Check if Firebase is clearing the result too quickly

## Debugging Commands

### View All Auth Debug Logs
```bash
adb logcat | grep "AUTH DEBUG"
```

### View Firebase Logs
```bash
adb logcat | grep -i "firebase\|auth"
```

### View Capacitor Logs
```bash
adb logcat | grep -i "capacitor\|appUrlOpen"
```

### Clear App Data and Test
```bash
adb shell pm clear com.household.routinemanager
# Then rebuild and install
npm run build
npm run cap:sync
# Build in Android Studio
```

## What to Share for Help

If the issue persists, share:

1. **Logs** (filtered by `AUTH DEBUG`):
   ```bash
   adb logcat | grep "AUTH DEBUG" > auth-debug.log
   ```

2. **`.env` file** (redact sensitive values):
   ```bash
   cat .env | grep VITE_FIREBASE
   ```

3. **AndroidManifest.xml** intent filters section

4. **Google Cloud Console** redirect URIs (screenshot)

5. **Exact error message** or behavior you see

## Expected Flow

1. ✅ User taps "Sign in with Google"
2. ✅ Browser opens → User authenticates
3. ✅ Google redirects to: `https://household-chores-d8eae.firebaseapp.com/__/auth/handler`
4. ✅ Android intercepts URL → App opens via deep link
5. ✅ `appUrlOpen` event fires with Firebase URL
6. ✅ `getRedirectResult()` processes authentication
7. ✅ User is signed in
8. ❌ **Should NOT see localhost redirect**

If you see localhost redirect, check:
- `.env` file
- Google Cloud Console redirect URIs
- AndroidManifest.xml intent filters
- Rebuild app after changes

