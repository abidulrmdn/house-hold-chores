# Email Verification Fix

## Problem
Firebase email verification links point to `firebaseapp.com/__/auth/action` which doesn't work properly. The verification needs to be handled in the app itself.

## Solution
The app now handles email verification directly using Firebase's `applyActionCode` function.

## How It Works

1. **Email Link Format**: When you receive a verification email, the link contains an `oobCode` parameter
2. **Manual Extraction**: If the Firebase link doesn't redirect properly, you can manually extract the code:
   - From the URL: `https://household-chores-d8eae.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=XXXXX&...`
   - Extract the `oobCode` value (the long string after `oobCode=`)
3. **Use This URL**: Navigate to your app with the code:
   ```
   http://localhost:5173?mode=verifyEmail&oobCode=YOUR_CODE_HERE
   ```

## Configuration Steps

### 1. Add Localhost to Authorized Domains (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/project/household-chores-d8eae/authentication/settings)
2. Scroll to "Authorized domains"
3. Click "Add domain"
4. Add `localhost` (if not already there)
5. Click "Add"

### 2. Update Email Action URL

The app now sends verification emails with `handleCodeInApp: true`, which means Firebase will redirect to your app with the verification code in the URL.

## Testing

1. Sign up with a new email
2. Check your inbox for the verification email
3. Click the link in the email
4. If Firebase redirects properly, you'll be taken to your app and verification will happen automatically
5. If the Firebase link doesn't work, manually extract the `oobCode` and navigate to:
   ```
   http://localhost:5173?mode=verifyEmail&oobCode=YOUR_CODE
   ```

## Troubleshooting

### Link doesn't redirect to localhost
- Make sure `localhost` is in Firebase authorized domains
- Try manually extracting the `oobCode` from the URL and using the format above

### "Invalid action code" error
- The verification code expires after a certain time
- Request a new verification email
- Make sure you're using the latest code from the most recent email

### Code not working
- Make sure you're copying the entire `oobCode` (it's a long string)
- Don't include any extra characters or spaces
- Try requesting a new verification email

## Production Deployment

When deploying to production:
1. Make sure your production domain is in Firebase authorized domains
2. The verification emails will automatically use your production URL
3. Users clicking the link will be redirected to your production app

