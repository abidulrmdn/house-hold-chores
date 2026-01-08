# Quick Publish Checklist 🚀

Follow these steps to publish your app to Google Play Store:

## ✅ Pre-Publishing Checklist

### 1. Set Up Signing (One-time setup)

```bash
# Generate keystore
./scripts/generate-keystore.sh

# Create keystore.properties file
cp android/keystore.properties.template android/keystore.properties
# Edit android/keystore.properties and add your passwords
```

**⚠️ CRITICAL:** Backup your keystore file! You'll need it for all future updates.

### 2. Prepare App Materials

- [ ] App name finalized
- [ ] Short description (80 chars max)
- [ ] Full description (4000 chars max)
- [ ] App icon (512x512px) ✅ Already generated
- [ ] Feature graphic (1024x500px) - Create this
- [ ] Screenshots (at least 2, up to 8)
- [ ] Privacy policy URL (required!)

### 3. Google Play Console Setup

- [ ] Create Google Play Developer account ($25)
- [ ] Complete account verification
- [ ] Create new app in Play Console

### 4. Build Release Bundle

```bash
npm run android:release
```

This will:
- Build web assets
- Sync Capacitor
- Build signed Android App Bundle (.aab)

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### 5. Upload to Play Console

- [ ] Upload .aab file
- [ ] Complete store listing
- [ ] Add screenshots
- [ ] Set content rating
- [ ] Add privacy policy URL
- [ ] Complete data safety form
- [ ] Set pricing (Free/Paid)
- [ ] Select countries

### 6. Submit for Review

- [ ] Review all sections
- [ ] Submit for review
- [ ] Wait 1-7 days for approval

## 📝 Version Management

When updating your app:

1. Update version in `android/app/build.gradle`:
   ```gradle
   versionCode 2  // Increment by 1
   versionName "1.1"  // Update version
   ```

2. Build new release:
   ```bash
   npm run android:release
   ```

3. Upload new .aab to Play Console

## 🔐 Security Reminders

- ✅ Keystore files are in .gitignore (already configured)
- ⚠️ Never commit keystore.properties
- ⚠️ Backup keystore securely
- ⚠️ Store passwords in password manager

## 📚 Full Documentation

See `GOOGLE_PLAY_PUBLISH_GUIDE.md` for detailed instructions.

## 🆘 Need Help?

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)

