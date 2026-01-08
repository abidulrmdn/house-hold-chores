# Google Cloud Console Redirect URI Verification - STEP BY STEP

## 🚨 CRITICAL: This is the root cause of the localhost redirect issue!

## Direct Link to Your OAuth Settings

**Open this link:**
https://console.cloud.google.com/apis/credentials?project=household-chores-d8eae

---

## Step-by-Step Verification

### Step 1: Open Google Cloud Console

1. Click the link above (or go to https://console.cloud.google.com/)
2. **Make sure you're logged in** with the same Google account used for Firebase
3. **Select the correct project** from the dropdown at the top:
   - Project: `household-chores-d8eae`
   - If you don't see it, search for it in the dropdown

### Step 2: Navigate to Credentials

1. In the left sidebar, click **"APIs & Services"**
2. Click **"Credentials"** (or it might already be selected)

### Step 3: Find Your OAuth 2.0 Client IDs

You should see a section called **"OAuth 2.0 Client IDs"**

You'll see multiple clients listed. Look for:
- **Web application** ← **THIS IS THE ONE WE NEED**
- Android (if you added Android app)
- iOS (if you added iOS app)

### Step 4: Click on "Web application" Client

1. **Click on the "Web application" OAuth client**
   - It should have your Firebase project name or something like "Web client (auto created by Google Service)"
   - The name might be: `household-chores-d8eae` or similar

2. This opens the **edit page** for that OAuth client

### Step 5: Check "Authorized redirect URIs"

Scroll down to the section called **"Authorized redirect URIs"**

---

## ✅ WHAT MUST BE PRESENT

**You MUST have these exact URIs (copy-paste these):**

```
https://household-chores-d8eae.firebaseapp.com/__/auth/handler
https://household-chores-d8eae.web.app/__/auth/handler
```

**Important:**
- Must be `https://` (not `http://`)
- Must include `/__/auth/handler` at the end
- No trailing slashes
- Exact match (case-sensitive)

---

## ❌ WHAT MUST NOT BE PRESENT

**If you see ANY of these, DELETE them:**

```
http://localhost:5173/__/auth/handler
https://localhost/__/auth/handler
http://localhost/__/auth/handler
http://127.0.0.1/__/auth/handler
https://127.0.0.1/__/auth/handler
```

**Why?** These cause Google to redirect to localhost, which fails on mobile devices.

---

## Step 6: Add Missing URIs (if needed)

If the Firebase domain URIs are missing:

1. Click **"+ ADD URI"** button
2. Paste: `https://household-chores-d8eae.firebaseapp.com/__/auth/handler`
3. Click **"+ ADD URI"** again
4. Paste: `https://household-chores-d8eae.web.app/__/auth/handler`
5. Click **"SAVE"** at the bottom

---

## Step 7: Remove Localhost URIs (if present)

If you see any localhost URIs:

1. Click the **trash icon** (🗑️) next to each localhost URI
2. Click **"SAVE"** at the bottom

---

## Step 8: Verify "Authorized JavaScript origins"

While you're here, also check **"Authorized JavaScript origins"** section:

**Should have:**
```
https://household-chores-d8eae.firebaseapp.com
https://household-chores-d8eae.web.app
```

**Should NOT have:**
```
http://localhost:5173
https://localhost
```

---

## Step 9: Save and Wait

1. Click **"SAVE"** at the bottom of the page
2. **Wait 2-5 minutes** for changes to propagate
3. You might see a success message at the top

---

## Step 10: Clear App Data and Test

After saving:

1. **Clear app data** (removes cached OAuth settings):
   ```bash
   adb shell pm clear com.household.routinemanager
   ```

2. **Rebuild Android app**:
   ```bash
   cd android
   ./gradlew clean assembleDebug
   ```

3. **Install and test**:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

---

## What Happens If It's Wrong

### ❌ If localhost URIs are present:
- Google OAuth redirects to localhost
- Android can't intercept localhost URLs
- App stays in browser or shows error
- **Result:** Authentication fails

### ❌ If Firebase domain URIs are missing:
- Google OAuth rejects the redirect
- Firebase can't complete authentication
- **Result:** Authentication fails

### ✅ If Firebase domain URIs are correct:
- Google OAuth redirects to Firebase domain
- Android intercepts Firebase domain URL via deep link
- App opens → Auth completes
- **Result:** Authentication succeeds ✅

---

## Visual Guide

### Correct Configuration:
```
Authorized redirect URIs:
✓ https://household-chores-d8eae.firebaseapp.com/__/auth/handler
✓ https://household-chores-d8eae.web.app/__/auth/handler
```

### Incorrect Configuration:
```
Authorized redirect URIs:
✗ http://localhost:5173/__/auth/handler  ← DELETE THIS
✗ https://localhost/__/auth/handler      ← DELETE THIS
```

---

## Quick Checklist

- [ ] Opened Google Cloud Console
- [ ] Selected project: `household-chores-d8eae`
- [ ] Found "Web application" OAuth client
- [ ] Clicked on "Web application" client
- [ ] Checked "Authorized redirect URIs"
- [ ] Verified Firebase domain URIs are present
- [ ] Removed any localhost URIs
- [ ] Clicked "SAVE"
- [ ] Waited 2-5 minutes
- [ ] Cleared app data
- [ ] Rebuilt Android app
- [ ] Tested Google Sign-In

---

## Still Not Working?

If you've verified everything above and it's still not working:

1. **Double-check the URIs** - Copy-paste them exactly, no typos
2. **Check project selection** - Make sure you're editing the correct project
3. **Wait longer** - OAuth changes can take up to 10 minutes
4. **Check browser cache** - Clear browser cache and cookies
5. **Verify Firebase project** - Make sure `household-chores-d8eae` is your Firebase project ID

---

## Alternative: Quick Access via Firebase Console

1. Go to: https://console.firebase.google.com/project/household-chores-d8eae/authentication/providers
2. Click on **Google** provider
3. Look for **"Open Google Cloud Console"** or **"Manage OAuth clients"** link
4. This takes you directly to the OAuth client settings

---

## Summary

**The fix is simple:**
1. Add Firebase domain redirect URIs
2. Remove localhost redirect URIs
3. Save and wait
4. Test

This is 99% likely the root cause of your issue!

