# Fix Google Sign-In Error Code 10 (DEVELOPER_ERROR)

## Problem
Error code 10 means `DEVELOPER_ERROR` - this usually indicates that the SHA-1 fingerprint is not configured in Firebase/Google Cloud Console.

## Solution: Add SHA-1 Fingerprint to Firebase

### Step 1: Get Your Debug SHA-1 Fingerprint

Run this command in your terminal:

```bash
cd android
./gradlew signingReport
```

Or if you're on Windows:
```bash
cd android
gradlew signingReport
```

Look for the output under `Variant: debug` → `Config:` → `SHA1:` - copy that value.

**Alternative method (if gradlew doesn't work):**

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Look for `SHA1:` in the output.

### Step 2: Add SHA-1 to Firebase Console

1. Go to: https://console.firebase.google.com/project/household-chores-d8eae/settings/general
2. Scroll down to "Your apps" section
3. Find your Android app (package: `com.household.routinemanager`)
4. Click "Add fingerprint"
5. Paste your SHA-1 fingerprint
6. Click "Save"

### Step 3: Download Updated google-services.json

After adding the SHA-1:
1. Click "Download google-services.json" button
2. Replace the file in `android/app/google-services.json`
3. Rebuild the app

### Step 4: Verify OAuth Client Configuration

1. Go to: https://console.cloud.google.com/apis/credentials?project=household-chores-d8eae
2. Find your Android OAuth 2.0 Client ID
3. Make sure the package name matches: `com.household.routinemanager`
4. Verify the SHA-1 fingerprint is listed

## Quick Command to Get SHA-1

```bash
# Navigate to android directory
cd android

# Get SHA-1 fingerprint
./gradlew signingReport | grep -A 5 "Variant: debug" | grep SHA1
```

Or use keytool directly:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1
```

## After Adding SHA-1

1. Download the updated `google-services.json` from Firebase Console
2. Replace `android/app/google-services.json` with the new file
3. Rebuild the app:
   ```bash
   npm run build
   npm run cap:sync
   ```
4. Build and test in Android Studio

## Still Getting Error?

If you're still getting error code 10 after adding SHA-1:

1. **Check package name matches**: Make sure `com.household.routinemanager` matches everywhere
2. **Wait a few minutes**: Firebase can take a few minutes to propagate changes
3. **Clear app data**: Uninstall and reinstall the app
4. **Check OAuth consent screen**: Make sure it's configured in Google Cloud Console
5. **Verify Web Client ID**: Make sure `VITE_GOOGLE_WEB_CLIENT_ID` in `.env` is correct

