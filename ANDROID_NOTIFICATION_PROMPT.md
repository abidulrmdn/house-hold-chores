# Android Notification Prompt - One-Time Setup

## Overview
Added a one-time notification prompt that appears when Android mobile users first open the app. This prompt asks users to enable push notifications.

## Features

### ✅ One-Time Only
- Uses `localStorage` to track if the prompt has been shown
- Key: `notification-prompt-shown`
- Once shown (or dismissed), it won't appear again

### ✅ Android Mobile Only
- Only displays on Android devices (using `isAndroid()` utility)
- Checks for Capacitor Android platform or Android user agent
- Won't show on iOS, web browsers, or desktop

### ✅ Smart Detection
- Checks if user is logged in before showing
- Checks if notifications are already enabled in Firestore
- If notifications are already enabled, prompt won't show

### ✅ User-Friendly Design
- Modal overlay with smooth animations
- Clear explanation of notification benefits
- Two options: "Enable Notifications" or "Maybe Later"
- Loading state while enabling notifications

## Implementation

### Component: `NotificationPrompt.tsx`
Located at: `src/components/NotificationPrompt.tsx`

### Integration
Added to `Dashboard.tsx`:
```tsx
import NotificationPrompt from '@/components/NotificationPrompt'

// In render:
<NotificationPrompt />
```

## How It Works

1. **On App Load** (Android mobile only):
   - Checks if prompt was already shown (`localStorage`)
   - Checks if user is logged in
   - Checks if notifications are already enabled
   - If all conditions pass, shows prompt after 2 seconds

2. **When User Clicks "Enable Notifications"**:
   - Requests notification permission
   - Gets FCM token
   - Saves token to Firestore (`users/{userId}`)
   - Sets `notificationEnabled: true`
   - Marks prompt as shown
   - Shows success toast

3. **When User Clicks "Maybe Later"**:
   - Marks prompt as shown
   - Closes modal
   - Won't show again

## Benefits Listed in Prompt

The prompt explains users will get notified when:
- ✅ New routines are added to your household
- ✅ Daily task reminders at 8 AM
- ✅ Important updates from your household

## Testing

### To Test:
1. **Clear localStorage** (to reset prompt):
   ```javascript
   localStorage.removeItem('notification-prompt-shown')
   ```

2. **Open app on Android mobile device**

3. **Expected behavior**:
   - Prompt appears after 2 seconds
   - User can enable or dismiss
   - Won't show again after dismissal

### To Reset for Testing:
```javascript
// In browser console or app:
localStorage.removeItem('notification-prompt-shown')
```

## Technical Details

### Dependencies
- `isAndroid()` from `@/utils/device`
- `requestNotificationPermission()` from `@/firebase/config`
- `useAuthStore` for user state
- `useTranslation` for i18n (if needed)

### Styling
- Uses Tailwind CSS classes
- Dark mode support
- Responsive design
- Smooth animations (`animate-slide-up`, `animate-fade-in`)

### Storage
- Uses `localStorage` for one-time tracking
- Key: `notification-prompt-shown`
- Value: `'true'` (string)

## Future Enhancements

Possible improvements:
- Add i18n support for prompt text
- Allow re-showing after X days if dismissed
- Track prompt acceptance rate
- A/B testing different prompt designs

## Notes

- Prompt only shows once per user (per device)
- If user enables notifications manually before prompt shows, prompt won't appear
- Prompt respects user's notification settings
- Works with the existing notification system

