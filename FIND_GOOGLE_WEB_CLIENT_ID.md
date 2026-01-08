# How to Find/Create Google Web Client ID

## Step-by-Step Instructions

### Option 1: Check if Web Client ID Already Exists

1. **Go to Google Cloud Console:**
   - Open: https://console.cloud.google.com/apis/credentials?project=household-chores-d8eae
   - Or navigate: Google Cloud Console → Select project "household-chores-d8eae" → APIs & Services → Credentials

2. **Look for existing OAuth 2.0 Client IDs:**
   - Scroll down to the "OAuth 2.0 Client IDs" section
   - Look for entries with type "Web application" or "Web client"
   - If you see one, click on it and copy the "Client ID"

### Option 2: Create a New Web Client ID

If you don't see a Web application client ID:

1. **Go to Credentials page:**
   - https://console.cloud.google.com/apis/credentials?project=household-chores-d8eae

2. **Click "Create Credentials" button** (top of the page)
   - It's usually a blue button at the top

3. **Select "OAuth client ID"** from the dropdown menu

4. **If prompted, configure OAuth consent screen first:**
   - User Type: External (unless you have a Google Workspace)
   - App name: "Household Routine Manager"
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue"
   - Scopes: Click "Save and Continue" (default scopes are fine)
   - Test users: Click "Save and Continue" (skip for now)
   - Summary: Click "Back to Dashboard"

5. **Create OAuth Client ID:**
   - Application type: Select **"Web application"**
   - Name: "Household Routine Manager Web"
   - Authorized JavaScript origins: Click "Add URI" and add:
     ```
     https://household-chores-d8eae.web.app
     https://household-chores-d8eae.firebaseapp.com
     ```
   - Authorized redirect URIs: Click "Add URI" and add:
     ```
     https://household-chores-d8eae.firebaseapp.com/__/auth/handler
     https://household-chores-d8eae.web.app/__/auth/handler
     ```
   - Click **"Create"**

6. **Copy the Client ID:**
   - A popup will show your Client ID
   - It looks like: `123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`
   - Copy this entire string

### Option 3: Check Firebase Console (Alternative)

Sometimes Firebase creates the Web client ID automatically:

1. Go to: https://console.firebase.google.com/project/household-chores-d8eae/settings/general
2. Scroll to "Your apps" section
3. Look for the Web app (if you have one registered)
4. The Web Client ID might be shown there

### Option 4: Use Firebase's Auto-Generated Client ID

Firebase might have already created a Web client ID. You can find it in:

1. **Firebase Console → Project Settings → General**
2. Look for "Web API Key" or check the Firebase config
3. However, for native Google Sign-In, you need the **OAuth 2.0 Client ID**, not the API key

## What the Client ID Looks Like

The Web Client ID format is:
```
123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

It's different from:
- **Android Client ID**: Usually shorter, used in `google-services.json`
- **API Key**: Different format, starts with `AIza...`

## Quick Check: Do You Already Have It?

If you've set up Firebase Authentication with Google before, you might already have a Web client ID. Check:

1. **Google Cloud Console → APIs & Services → Credentials**
2. Look for any entry with "Web application" type
3. If you see multiple entries, look for one that's NOT specifically for Android/iOS

## Still Can't Find It?

If you can't find or create it:

1. **Screenshot the Credentials page** and I can help identify which one to use
2. Or **create a new one** following Option 2 above - it's safe to have multiple client IDs

## After You Get the Client ID

1. Add it to your `.env` file:
   ```bash
   VITE_GOOGLE_WEB_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```

2. Rebuild:
   ```bash
   npm run build
   npm run cap:sync
   ```

3. Test the sign-in flow!

