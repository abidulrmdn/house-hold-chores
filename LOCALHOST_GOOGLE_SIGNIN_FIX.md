# Fix: Google Sign-In Popup Goes to Production Domain

## Why This Happens

When you sign in with Google on localhost, the popup flow is:
1. Popup opens → Google OAuth page
2. Google redirects → Firebase auth handler (production domain)
3. Firebase processes auth → Popup closes → Returns to localhost

**The popup showing the production domain is normal** - that's where Firebase's auth handler is located. The popup should close automatically after authentication.

## If Popup Stays Open

If the popup stays open on the production domain instead of closing, you need to add `localhost` to Firebase authorized domains.

### Step 1: Add Localhost to Firebase Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `household-chores-d8eae`
3. Go to **Authentication** → **Settings** tab
4. Scroll to **Authorized domains** section
5. Click **"Add domain"**
6. Add: `localhost`
7. Click **"Add"**
8. Save

### Step 2: Verify Google Cloud Console (Optional)

For popup flow, you typically don't need localhost in Google Cloud Console redirect URIs. But if you want redirect to work too:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `household-chores-d8eae`
3. Go to **APIs & Services** → **Credentials**
4. Click on your **Web application** OAuth client
5. Under **Authorized redirect URIs**, add:
   - `http://localhost:5173/__/auth/handler`
6. Click **Save**

## How Popup Flow Works

```
Main Window (localhost:5173)
    ↓ User clicks "Sign in with Google"
Popup Opens
    ↓ Redirects to Google OAuth
Google OAuth Page
    ↓ User signs in
Firebase Auth Handler (production domain)
    ↓ Processes auth
Popup Closes Automatically
    ↓ Returns result
Main Window (localhost:5173) ← User is signed in
```

## Current Code Behavior

- **Localhost**: Always uses popup (no redirect issues)
- **Production**: Uses popup for desktop, redirect for mobile web
- **Native App**: Uses Capacitor Google Auth

## Testing

After adding localhost to Firebase authorized domains:

1. Clear browser cache
2. Try Google sign-in again
3. Popup should close automatically after authentication
4. You should be signed in on localhost

## Troubleshooting

**Popup stays open:**
- Check Firebase authorized domains includes `localhost`
- Check browser console for errors
- Try clearing browser cache

**Popup closes but sign-in fails:**
- Check browser console for error messages
- Verify Firebase config is correct
- Check that Google sign-in is enabled in Firebase Console

