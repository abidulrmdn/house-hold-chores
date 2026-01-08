# Troubleshooting Push Notifications

## Issue: Mobile user not receiving notifications when routine is created

### Root Cause
The `onRoutineCreated` Cloud Function sends push notifications to household members when a routine is created. For notifications to work, the mobile user must have:
1. `notificationEnabled: true` in their Firestore user document
2. A valid `fcmToken` in their Firestore user document
3. The Cloud Function must be deployed (✅ now fixed)

### How to Check User's Notification Status

#### Option 1: Firebase Console
1. Go to Firebase Console → Firestore Database
2. Navigate to `users` collection
3. Find the mobile user's document (by their user ID)
4. Check if these fields exist:
   - `notificationEnabled: true`
   - `fcmToken: "some-token-string"`

#### Option 2: Using Firebase CLI
```bash
# Get user's document
firebase firestore:get users/USER_ID
```

### How to Fix

#### Step 1: Ensure Mobile User Has Enabled Notifications
1. Open the app on the mobile device
2. Click the bell icon (🔔) in the header
3. Grant notification permission when prompted
4. Verify the green dot appears next to the bell icon

#### Step 2: Verify FCM Token is Saved
The app automatically saves the FCM token to Firestore when notifications are enabled. To verify:
1. Check Firestore console for the user's document
2. Look for `fcmToken` field
3. If missing, the user needs to enable notifications again

#### Step 3: Test the Function
After ensuring the mobile user has notifications enabled:

1. **Create a test routine** from another user (browser)
2. **Check Cloud Function logs**:
   ```bash
   firebase functions:log --only onRoutineCreated
   ```
3. Look for:
   - "Sent routine creation notification to user {userId}"
   - Any error messages

### Common Issues

#### Issue: "No users with notifications enabled"
**Solution**: The mobile user hasn't enabled notifications. They need to:
1. Open the app
2. Click the bell icon
3. Grant permission

#### Issue: "User has no FCM token"
**Solution**: The token wasn't saved. Possible causes:
- VAPID key not configured (check `.env` file)
- Notification permission denied
- Browser/app doesn't support FCM

**Fix**: 
1. Check `VITE_FIREBASE_VAPID_KEY` in `.env` file
2. User should disable and re-enable notifications
3. Check browser console for errors

#### Issue: "Invalid FCM token"
**Solution**: The token expired or is invalid. The function automatically disables notifications for users with invalid tokens.

**Fix**: User needs to re-enable notifications to get a new token.

### Testing Notifications

#### Test 1: Manual Function Call
```bash
# Use Firebase Console → Functions → onRoutineCreated → Test
# Or use the testPushNotification function:
# In the app, go to Settings → Test Notifications
```

#### Test 2: Create a Routine
1. User A (browser) creates a routine
2. Check if User B (mobile) receives notification
3. Check Cloud Function logs for errors

### Debugging Steps

1. **Check Cloud Function is deployed**:
   ```bash
   firebase functions:list | grep onRoutineCreated
   ```

2. **Check user's Firestore document**:
   - `notificationEnabled: true`
   - `fcmToken: "valid-token"`
   - `householdId: "same-as-routine"`

3. **Check Cloud Function logs**:
   ```bash
   firebase functions:log --only onRoutineCreated --limit 50
   ```

4. **Check for errors**:
   - Invalid tokens
   - Missing householdId
   - Permission errors

### Mobile-Specific Notes

#### Android (Capacitor)
- FCM tokens work the same way as web
- Make sure the app has notification permissions granted
- Check Android notification settings for the app

#### iOS (Capacitor)
- Requires additional setup for push notifications
- May need APNs certificates configured

### Next Steps

1. ✅ Cloud Function deployed
2. ⏳ Verify mobile user has `notificationEnabled: true` and `fcmToken`
3. ⏳ Test by creating a routine from browser user
4. ⏳ Check logs if notifications still don't work

