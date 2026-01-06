# Android App Quick Start

## 🚀 Quick Setup (5 minutes)

### Prerequisites
- ✅ Node.js 18+ installed
- ✅ Android Studio installed
- ✅ Android SDK installed (via Android Studio)

### Step 1: Build Web App
```bash
npm run build
```

### Step 2: Sync to Android
```bash
npm run cap:sync
```

### Step 3: Open in Android Studio
```bash
npm run cap:open:android
```

### Step 4: Run on Device
1. Connect Android device (enable USB debugging)
2. Or start an emulator in Android Studio
3. Click the green "Run" button in Android Studio

## 📱 Testing on Your Phone

### Enable USB Debugging
1. Go to Settings → About Phone
2. Tap "Build Number" 7 times
3. Go back → Developer Options
4. Enable "USB Debugging"
5. Connect phone via USB
6. Accept debugging prompt on phone

### Run App
1. Open Android Studio
2. Click "Run" (or press Shift+F10)
3. Select your device
4. App will install and launch!

## 🔨 Building Release APK

### Quick Build (Debug)
```bash
cd android
./gradlew assembleDebug
```
APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release Build (for distribution)
See `ANDROID_BUILD_GUIDE.md` for detailed instructions on creating signed release builds.

## 📝 Common Commands

```bash
# Build web app
npm run build

# Sync to Android
npm run cap:sync

# Build and sync (combined)
npm run cap:build

# Open Android Studio
npm run cap:open:android

# Clean Android build
cd android && ./gradlew clean
```

## 🐛 Troubleshooting

### "SDK location not found"
Create `android/local.properties`:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```
(Replace YOUR_USERNAME with your actual username)

### App crashes on launch
1. Check Android Studio Logcat for errors
2. Verify Firebase config in `.env` file
3. Make sure you've run `npm run build` before syncing

### Web assets not updating
Always run `npm run cap:sync` after building:
```bash
npm run build && npm run cap:sync
```

### "Duplicate class kotlin.collections.jdk8" errors
This is already fixed in the build.gradle files. If you still see it:
1. In Android Studio: File → Sync Project with Gradle Files
2. Build → Clean Project
3. Build → Rebuild Project

## 📚 Next Steps

- See `ANDROID_BUILD_GUIDE.md` for detailed build instructions
- Customize app icons (see guide)
- Prepare for Play Store release
- Test on multiple devices

---

**Ready to build?** Run `npm run cap:build` and then `npm run cap:open:android`!

