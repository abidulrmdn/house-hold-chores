# Send Push Notifications to Specific Users from Firebase

## Methods to Send Notifications

### Method 1: Firebase Console - Cloud Functions (Recommended)

1. **Go to Firebase Console**
   - Navigate to: https://console.firebase.google.com/project/household-chores-d8eae/functions
   - Click on `sendNotificationToUser` function

2. **Test the Function**
   - Click "Test" tab
   - **Important**: When testing from Firebase Console, enter the data directly (not wrapped):
   ```json
   {
     "userId": "USER_ID_HERE",
     "taskCount": 1,
     "delaySeconds": 0
   }
   ```
   - **Note**: Make sure `userId` is a valid user ID from Firestore `users` collection
   - Click "Test function"
   - Notification will be sent immediately
   
   **Common Error**: If you get "INVALID_ARGUMENT" error:
   - Verify `userId` exists in Firestore `users` collection
   - Make sure `userId` is a string (not wrapped in quotes twice)
   - Check that user has `fcmToken` field in their document

3. **Get User ID**
   - Go to Firestore Console
   - Navigate to `users` collection
   - Find the user document
   - Copy the document ID (that's the userId)

### Method 2: Firebase Functions Shell (CLI)

```bash
# Start Firebase Functions shell
firebase functions:shell

# Call the function
sendNotificationToUser({
  userId: 'USER_ID_HERE',
  taskCount: 1,
  delaySeconds: 0
})
```

### Method 3: HTTP Request (cURL)

First, get your Firebase Auth token:

```bash
# Get auth token (requires Firebase CLI login)
firebase login:ci
```

Then call the function:

```bash
curl -X POST \
  https://us-central1-household-chores-d8eae.cloudfunctions.net/sendNotificationToUser \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "data": {
      "userId": "USER_ID_HERE",
      "taskCount": 1,
      "delaySeconds": 0
    }
  }'
```

### Method 4: Firebase Cloud Messaging Console (Direct Token)

If you have the FCM token directly:

1. Go to Firebase Console → Cloud Messaging
2. Click "Send test message"
3. Enter the FCM token (from `users/{userId}.fcmToken` in Firestore)
4. Compose your message
5. Send

## Function Parameters

### `sendNotificationToUser`

**Parameters:**
- `userId` (required): The user ID from Firestore `users` collection
- `taskCount` (optional, default: 1): Number of tasks to show in notification
- `delaySeconds` (optional, default: 0): Delay before sending (useful for testing)

**Example:**
```json
{
  "userId": "kk1Pl9DSnjS5aA954MqMeOKVW9W2",
  "taskCount": 5,
  "delaySeconds": 10
}
```

## Finding User Information

### Get User ID:
1. Firebase Console → Firestore Database
2. Navigate to `users` collection
3. Find user by email or display name
4. Copy the document ID

### Get FCM Token:
1. Firebase Console → Firestore Database
2. Navigate to `users/{userId}` document
3. Check `fcmToken` field
4. Copy the token value

### Check if User Has Notifications Enabled:
- Look for `notificationEnabled: true` in user document
- Check if `fcmToken` field exists

## Testing Scenarios

### Test Immediate Notification:
```json
{
  "userId": "USER_ID",
  "taskCount": 1,
  "delaySeconds": 0
}
```

### Test Delayed Notification (10 seconds):
```json
{
  "userId": "USER_ID",
  "taskCount": 1,
  "delaySeconds": 10
}
```

### Test Multiple Tasks:
```json
{
  "userId": "USER_ID",
  "taskCount": 5,
  "delaySeconds": 0
}
```

## Troubleshooting

### "User not found"
- Verify the userId exists in Firestore `users` collection
- Check spelling/case sensitivity

### "User has no FCM token"
- User hasn't enabled notifications in the app
- Ask user to click the bell icon and enable notifications
- Token is stored in `users/{userId}.fcmToken`

### "Invalid FCM token"
- Token may have expired
- User may have uninstalled/reinstalled app
- Function will automatically disable notifications for invalid tokens

### Notification Not Received
1. Check user has `notificationEnabled: true`
2. Verify `fcmToken` exists and is valid
3. Check browser/device notification permissions
4. Check function logs: `firebase functions:log --only sendNotificationToUser`

## Security Note

The function requires authentication, so you must:
- Be logged in to Firebase Console
- Or provide valid auth token in HTTP requests
- Or use Firebase CLI with proper authentication

