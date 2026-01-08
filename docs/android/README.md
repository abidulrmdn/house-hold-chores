# Android App Development

This guide covers building and deploying the Household Routine Manager as a native Android app using Capacitor.

## Quick Start

### Prerequisites

- ✅ Node.js 18+ installed
- ✅ Android Studio installed
- ✅ Android SDK installed (via Android Studio)

### 5-Minute Setup

```bash
# 1. Build web app
npm run build

# 2. Sync to Android
npm run cap:sync

# 3. Open in Android Studio
npm run cap:open:android
```

Then in Android Studio:
1. Connect Android device (enable USB debugging) or start emulator
2. Click the green "Run" button
3. App will install and launch!

## Documentation

- **[Quick Start Guide](./quick-start.md)** - Get up and running in 5 minutes
- **[Android Studio Setup](./android-studio-setup.md)** - Detailed setup instructions
- **[Build Guide](./build-guide.md)** - Building release APKs and AABs
- **[Deployment](./deployment.md)** - Publishing to Google Play Store
- **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions

## Development Workflow

### Standard Workflow

1. **Make changes** to your React app
2. **Build web app**: `npm run build`
3. **Sync to Android**: `npm run cap:sync`
4. **Test in Android Studio**: `npm run cap:open:android`
5. **Run on device/emulator** from Android Studio

### Combined Command

```bash
npm run cap:build  # Builds and syncs in one command
```

## Project Structure

```
android/
├── app/
│   ├── src/main/
│   │   ├── java/com/household/routinemanager/
│   │   │   └── MainActivity.java  # Native Android code
│   │   ├── res/                   # Icons, splash screens
│   │   └── AndroidManifest.xml    # App permissions & config
│   └── build.gradle               # Build configuration
├── build.gradle                   # Project-level config
└── settings.gradle                # Project settings
```

## Common Commands

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

# Build debug APK
cd android && ./gradlew assembleDebug

# Build release APK
cd android && ./gradlew assembleRelease

# Build release AAB (for Play Store)
cd android && ./gradlew bundleRelease
```

## Testing on Device

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

## Next Steps

- [Quick Start Guide](./quick-start.md) - Get started quickly
- [Build Guide](./build-guide.md) - Build release versions
- [Deployment Guide](./deployment.md) - Publish to Play Store

