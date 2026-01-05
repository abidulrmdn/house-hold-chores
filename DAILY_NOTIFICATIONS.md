# Daily Notifications Setup

## How Daily Notifications Work

### Where Users Receive Notifications

Users receive notifications in **two ways**:

1. **Browser/System Notifications** (when browser is open)
   - Appears as native OS notifications
   - Desktop: Top-right corner (Windows/macOS)
   - Mobile: Notification tray/center
   - Works even when browser tab is in background

2. **Push Notifications** (works even when browser is closed)
   - Sent via Firebase Cloud Messaging (FCM)
   - Appears on device notification center
   - Works on mobile and desktop
   - **Requires Cloud Functions deployment**

### Current Implementation

#### ✅ What Works Now:
- **Browser notifications** when browser is open
- Notifications appear at 8 AM (if browser is open)
- Status indicator (green/gray dot) shows if enabled

#### ⚠️ Limitation:
- The `setTimeout` approach only works when the browser tab is open
- If browser is closed, notifications won't be sent

### Proper Implementation (Cloud Functions)

To make notifications work **even when browser is closed**, you need to deploy the Cloud Function:

#### 1. **FCM Token Storage**
- When user enables notifications, their FCM token is saved to Firestore (`users/{userId}.fcmToken`)
- Token is automatically updated when user enables/disables notifications

#### 2. **Scheduled Cloud Function**
- Cloud Function runs daily at **8:00 AM UTC** (adjust timezone as needed)
- Queries all users with `notificationEnabled: true`
- Checks their incomplete tasks due today
- Sends FCM push notification if they have tasks

#### 3. **Deployment Steps**

```bash
# 1. Build functions
cd functions
npm run build

# 2. Deploy the scheduled function
firebase deploy --only functions:sendDailyTaskReminders

# 3. Verify deployment
firebase functions:log --only sendDailyTaskReminders
```

#### 4. **Testing**

To test the function manually:

```bash
# Trigger the function manually (for testing)
firebase functions:shell
# Then in the shell:
sendDailyTaskReminders()
```

Or test via Firebase Console:
1. Go to Firebase Console → Functions
2. Find `sendDailyTaskReminders`
3. Click "Test" to trigger manually

### Configuration

#### Timezone Adjustment

To change the notification time, edit `functions/src/index.ts`:

```typescript
export const sendDailyTaskReminders = functions.pubsub
  .schedule('0 8 * * *') // 8 AM UTC
  .timeZone('America/New_York') // Change timezone
  .onRun(async (context) => {
    // ...
  })
```

**Cron Format**: `'0 8 * * *'` means:
- `0` = minute (0)
- `8` = hour (8 AM)
- `*` = every day of month
- `*` = every month
- `*` = every day of week

#### Notification Content

The notification message is customizable in `functions/src/index.ts`:

```typescript
const title = taskCount === 1 
  ? '1 task due today! 📋'
  : `${taskCount} tasks due today! 📋`

const body = taskCount === 1
  ? 'You have 1 task to complete today. Check it out!'
  : `You have ${taskCount} tasks to complete today. Let's get started!`
```

### How It Works

1. **User enables notifications** → FCM token saved to Firestore
2. **Cloud Function runs daily at 8 AM** → Checks all users
3. **For each user**:
   - Queries their incomplete tasks due today
   - If tasks exist → Sends FCM push notification
   - If no tasks → Skips (no notification)
4. **User receives notification** → Even if browser is closed!

### Troubleshooting

#### Notifications not working?

1. **Check FCM token is saved**:
   - Open Firestore Console
   - Check `users/{userId}` document
   - Verify `fcmToken` and `notificationEnabled: true` exist

2. **Check Cloud Function logs**:
   ```bash
   firebase functions:log --only sendDailyTaskReminders
   ```

3. **Verify function is deployed**:
   ```bash
   firebase functions:list
   ```

4. **Check notification permissions**:
   - User must grant notification permission
   - Browser must support notifications
   - VAPID key must be configured

#### Invalid Token Errors

If you see `messaging/invalid-registration-token` errors:
- Token may have expired
- User may have uninstalled/reinstalled app
- Function automatically disables notifications for invalid tokens

### Cost Considerations

- **Cloud Functions**: Free tier includes 2 million invocations/month
- **FCM**: Free for unlimited messages
- **Firestore**: Read/write operations count toward free tier

For a household app, this should stay well within free tier limits.

