# Android Deployment Guide

This guide covers publishing your Android app to the Google Play Store.

## Prerequisites

1. **Google Play Developer Account** ($25 one-time fee)
   - Sign up at: https://play.google.com/console/signup
   - Complete account verification and payment

2. **App Preparation**
   - App is tested and working
   - All features are functional
   - App icon and screenshots ready

## Step 1: Set Up App Signing

Android apps must be signed before publishing. We'll use Android App Bundle (AAB) format, which is required by Google Play.

### Generate a Keystore

```bash
cd android/app
keytool -genkey -v -keystore household-routine-manager-release.keystore -alias household-routine-manager -keyalg RSA -keysize 2048 -validity 10000
```

**Important:** 
- Save the keystore file securely (you'll need it for all future updates)
- Remember your keystore password and alias password
- Store these credentials securely (password manager recommended)

### Create keystore.properties

Create `android/keystore.properties`:

```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=household-routine-manager
storeFile=household-routine-manager-release.keystore
```

**⚠️ IMPORTANT:** Add `keystore.properties` to `.gitignore` to keep credentials secure!

### Update build.gradle

The `android/app/build.gradle` should already have signing config. If not, add:

```gradle
android {
    signingConfigs {
        release {
            def keystorePropertiesFile = rootProject.file("keystore.properties")
            def keystoreProperties = new Properties()
            if (keystorePropertiesFile.exists()) {
                keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Step 2: Build Release Bundle

### Build Web Assets

```bash
npm run build
```

### Sync Capacitor

```bash
npm run cap:sync
```

### Build Android App Bundle (AAB)

```bash
cd android
./gradlew bundleRelease
```

The AAB file will be generated at:
`android/app/build/outputs/bundle/release/app-release.aab`

**Note:** AAB is preferred over APK for Google Play Store as it allows Google to optimize the app for different device configurations.

## Step 3: Prepare App Listing Materials

Before uploading, prepare these materials:

### Required:
- **App Name:** Household Routine Manager
- **Short Description:** (80 characters max)
- **Full Description:** (4000 characters max)
- **App Icon:** 512x512px PNG
- **Feature Graphic:** 1024x500px PNG
- **Screenshots:** At least 2, up to 8 (phone and tablet)
- **Privacy Policy URL:** Required for apps that collect user data

## Step 4: Create App in Google Play Console

1. **Log in to Google Play Console**
   - Go to: https://play.google.com/console

2. **Create New App**
   - Click "Create app"
   - Fill in app details
   - Set as Free or Paid

3. **Complete Store Listing**
   - Upload app icon
   - Add descriptions
   - Upload screenshots
   - Add feature graphic
   - Set app category

4. **Set Content Rating**
   - Complete questionnaire
   - Wait for rating (usually instant)

5. **Set Up Privacy Policy**
   - Add URL to your privacy policy

## Step 5: Upload App Bundle

1. **Create Release**
   - Go to "Production" (or "Testing" for initial testing)
   - Click "Create new release"

2. **Upload AAB**
   - Upload the `app-release.aab` file
   - Add release notes

3. **Review Release**
   - Check all warnings/errors
   - Ensure all required information is complete

## Step 6: Submit for Review

1. **Review Checklist**
   - All required sections completed
   - App bundle uploaded
   - Store listing complete
   - Content rating done
   - Privacy policy added

2. **Submit**
   - Click "Review release" or "Start rollout to Production"
   - Review can take 1-7 days (usually 1-3 days)

## Updating Your App

For future updates:

1. Increment version numbers in `android/app/build.gradle`:
   ```gradle
   versionCode 2  // Increment by 1 for each release
   versionName "1.1"  // Update version name
   ```

2. Build new bundle:
   ```bash
   npm run build
   npm run cap:sync
   cd android && ./gradlew bundleRelease
   ```

3. Upload new AAB to Google Play Console
4. Add release notes
5. Submit for review

## Firebase Setup for Android

To enable Google Sign-In on Android, you need to:

1. **Create Android App in Firebase Console**
   - Go to Firebase Console → Project Settings
   - Click "Add app" → Android
   - Package name: `com.household.routinemanager`
   - Download `google-services.json`
   - Place it in `android/app/google-services.json`

2. **Add SHA-1 Fingerprint**
   - Get SHA-1: `cd android && ./gradlew signingReport`
   - Add SHA-1 in Firebase Console → Project Settings → Your apps → Android app

See [Firebase Android Setup](./firebase-setup.md) for detailed instructions.

## Troubleshooting

### Common Issues:

1. **"App requires privacy policy"**
   - Create and host a privacy policy page
   - Add URL in Play Console

2. **"App icon doesn't meet requirements"**
   - Ensure icon is exactly 512x512px
   - Use PNG format
   - No transparency

3. **"Screenshots don't meet requirements"**
   - Check dimensions and aspect ratio
   - Ensure screenshots show actual app content

4. **"App signing issues"**
   - Verify keystore file exists
   - Check keystore.properties credentials
   - Ensure keystore is not lost (backup securely!)

## Security Best Practices

1. **Never commit keystore files or keystore.properties to Git**
2. **Backup keystore file securely** (cloud storage, encrypted)
3. **Store passwords in password manager**
4. **Use different keystores for different apps**

## Resources

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [Play Console Policies](https://play.google.com/about/developer-content-policy/)

## Quick Command Reference

```bash
# Build and prepare for release
npm run build
npm run cap:sync

# Build release bundle
cd android
./gradlew bundleRelease

# Output location
# android/app/build/outputs/bundle/release/app-release.aab
```

