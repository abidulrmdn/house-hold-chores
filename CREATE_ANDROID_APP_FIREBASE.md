# Create Android App in Firebase Console

## Step-by-Step Instructions

### Step 1: Go to Firebase Console

1. Open: https://console.firebase.google.com/project/household-chores-d8eae/overview
2. Click on the gear icon (⚙️) next to "Project Overview"
3. Select **"Project settings"**

### Step 2: Add Android App

1. Scroll down to the **"Your apps"** section
2. Click the **Android icon** (or click **"Add app"** → **Android**)
3. Fill in the details:
   - **Android package name**: `com.household.routinemanager`
   - **App nickname** (optional): `Household Routine Manager Android`
   - **Debug signing certificate SHA-1** (optional for now, but we'll add it):
     ```
     C4:C8:69:CA:2A:E4:A0:38:13:B0:59:E9:8F:47:D4:DB:DC:FF:D1:C9
     ```
4. Click **"Register app"**

### Step 3: Download google-services.json

1. After registering, you'll see a download button for `google-services.json`
2. **Download** the file
3. **Copy** it to: `android/app/google-services.json`
   - Replace the existing file if it exists

### Step 4: Add SHA-1 Fingerprint (Important!)

1. Still in Firebase Console → Project Settings → Your apps
2. Find your newly created Android app
3. Click **"Add fingerprint"**
4. Paste your SHA-1:
   ```
   C4:C8:69:CA:2A:E4:A0:38:13:B0:59:E9:8F:47:D4:DB:DC:FF:D1:C9
   ```
5. Click **"Save"**

### Step 5: Verify google-services.json Location

Make sure the file is at:
```
android/app/google-services.json
```

### Step 6: Rebuild

After adding the Android app and SHA-1:

```bash
npm run build
npm run cap:sync
```

Then rebuild in Android Studio.

## Quick Checklist

- [ ] Android app created in Firebase Console
- [ ] Package name: `com.household.routinemanager`
- [ ] SHA-1 fingerprint added: `C4:C8:69:CA:2A:E4:A0:38:13:B0:59:E9:8F:47:D4:DB:DC:FF:D1:C9`
- [ ] `google-services.json` downloaded and placed in `android/app/`
- [ ] Rebuilt the app

## Why This is Needed

- Firebase needs to know about your Android app to enable Google Sign-In
- The SHA-1 fingerprint verifies your app's identity
- The `google-services.json` file contains configuration that the app needs

## After Setup

Once you've created the Android app and added the SHA-1, Google Sign-In should work! The error code 10 should be resolved.

