# Testing Push Notifications Locally

## Quick Test Guide

### Prerequisites

1. **Enable notifications** in the app (click the bell icon)
2. **Deploy the test function** (or use Firebase emulators)

### Option 1: Deploy Function (Recommended)

```bash
# Build functions
cd functions
npm run build

# Deploy only the test function
firebase deploy --only functions:testPushNotification
```

### Option 2: Use Firebase Emulators (Local Testing)

```bash
# Start emulators
firebase emulators:start --only functions,firestore

# In another terminal, run your app
npm run dev
```

Note: Emulators don't support FCM push notifications, so you'll need to deploy the function for real testing.

## Testing Steps

### 1. Enable Notifications

1. Open the app in your browser
2. Click the **bell icon** in the header
3. Grant notification permission when prompted
4. You should see a **green dot** on the bell (enabled status)

### 2. Test Push Notification

1. **Hover over the bell icon** (in development mode)
2. Click **"🧪 Test Push (1 task)"** or **"🧪 Test Push (5 tasks)"**
3. You should receive a push notification immediately!

### 3. Verify Token Storage

Check Firestore Console:
- Go to `users/{yourUserId}` document
- Verify `fcmToken` field exists
- Verify `notificationEnabled: true`

### 4. Test Different Scenarios

#### Test with 1 task:
- Click "🧪 Test Push (1 task)"
- Should show: "🧪 Test: 1 task due today! 📋"

#### Test with 5 tasks:
- Click "🧪 Test Push (5 tasks)"
- Should show: "🧪 Test: 5 tasks due today! 📋"

## Troubleshooting

### "Please enable notifications first!"
- Make sure you've clicked the bell icon and granted permission
- Check that the bell shows a green dot (enabled)

### "Functions not initialized"
- Make sure Firebase Functions are properly configured
- Check that `functions` is exported from `src/firebase/config.ts`

### "User has no FCM token"
- Re-enable notifications (click bell icon again)
- Check browser console for errors
- Verify VAPID key is configured in `.env`

### "Invalid FCM token"
- Token may have expired
- Re-enable notifications to get a new token
- Function will automatically disable notifications for invalid tokens

### Notification not appearing?

1. **Check browser permissions**:
   - Chrome: Settings → Privacy → Notifications
   - Firefox: Settings → Privacy → Notifications
   - Safari: Preferences → Websites → Notifications

2. **Check service worker**:
   - Open DevTools → Application → Service Workers
   - Verify service worker is active

3. **Check console logs**:
   - Look for FCM token in console
   - Check for any error messages

4. **Verify function deployment**:
   ```bash
   firebase functions:list
   ```

## Testing Daily Scheduled Notifications

To test the daily scheduled function manually:

```bash
# Option 1: Use Firebase Console
# Go to Functions → sendDailyTaskReminders → Test

# Option 2: Use Firebase CLI
firebase functions:shell
# Then in shell:
sendDailyTaskReminders()
```

## Expected Behavior

### When Test Succeeds:
- ✅ Toast message: "Test notification sent successfully!"
- ✅ Push notification appears on device
- ✅ Notification shows correct task count
- ✅ Notification has app icon

### When Test Fails:
- ❌ Toast error message with details
- ❌ Check console for detailed error
- ❌ Verify FCM token exists in Firestore

## Next Steps

After testing locally:
1. Deploy the scheduled function: `firebase deploy --only functions:sendDailyTaskReminders`
2. Users will receive daily notifications at 8 AM UTC
3. Notifications work even when browser is closed!

