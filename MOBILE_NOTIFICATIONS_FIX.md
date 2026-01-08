# Mobile Notifications Fix

## Issue
On mobile (Capacitor native app), enabling notifications shows error: "Failed to enable notifications. notifications not defined"

## Root Cause
The code was trying to use the web `Notification` API (`Notification.requestPermission()`) which doesn't exist in Capacitor native apps. Native apps handle push notifications differently.

## Solution
Updated the code to:
1. Detect if running in a Capacitor native app
2. Skip the `Notification` API check for native apps
3. Go directly to Firebase Messaging token retrieval
4. Add proper error handling for when Notification API is not available

## Changes Made

### 1. `src/firebase/config.ts` - `requestNotificationPermission()`
- Added check for Capacitor native app
- For native apps: Skip Notification API, get FCM token directly
- For web apps: Use Notification API as before

### 2. `src/pages/Dashboard.tsx`
- Added checks for `typeof Notification !== 'undefined'` before using Notification API
- Better error messages for native apps
- Handle "notifications not defined" errors gracefully

## Testing

### On Mobile (Capacitor App)
1. Open the app
2. Tap the bell icon (🔔) to enable notifications
3. Should now work without "notifications not defined" error
4. Check Firestore to verify `fcmToken` and `notificationEnabled: true` are saved

### On Web Browser
- Should continue to work as before
- Uses Notification API for permission

## Additional Notes

### For Android Capacitor Apps
Firebase Messaging should work in Capacitor apps. The FCM token is obtained directly from Firebase without needing the web Notification API.

### If Notifications Still Don't Work
1. **Check app permissions**: Make sure the app has notification permissions granted in Android settings
2. **Check Firebase config**: Ensure Firebase is properly configured in the Capacitor app
3. **Check FCM token**: Verify the token is saved in Firestore (`users/{userId}.fcmToken`)
4. **Check Cloud Function logs**: See if notifications are being sent

### Android Permissions
Make sure `android/app/src/main/AndroidManifest.xml` has:
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

## Next Steps
1. Test on mobile device
2. Verify FCM token is saved to Firestore
3. Create a routine from another user
4. Check if mobile user receives notification

