# Android Quick Start

Get your Android app running in 5 minutes!

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ Android Studio installed
- ✅ Android SDK installed (via Android Studio)

## Step 1: Build Web App

```bash
npm run build
```

This creates the `dist/` folder with your optimized web assets.

## Step 2: Sync to Android

```bash
npm run cap:sync
```

This copies web assets to the Android project and updates plugins.

**Or combine steps 1 & 2:**
```bash
npm run cap:build
```

## Step 3: Open in Android Studio

```bash
npm run cap:open:android
```

This automatically launches Android Studio and opens the project.

## Step 4: Run on Device

### Option A: Physical Device

1. **Enable USB Debugging** on your phone:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Go back → Developer Options → Enable "USB Debugging"
   - Connect phone via USB
   - Accept debugging prompt

2. **In Android Studio:**
   - Your device should appear in the device dropdown
   - Click the green "Run" button (or press Shift+F10)
   - App will install and launch!

### Option B: Emulator

1. **Create Virtual Device:**
   - Click "Device Manager" tab in Android Studio
   - Click "Create Device"
   - Choose a device (e.g., Pixel 5)
   - Select system image (e.g., API 33)
   - Click "Finish"

2. **Start Emulator:**
   - Click the ▶️ Play button next to your emulator
   - Wait for it to boot

3. **Run App:**
   - Select emulator from device dropdown
   - Click "Run" button
   - App will install and launch!

## Troubleshooting

### "SDK location not found"

Create `android/local.properties`:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```
(Replace YOUR_USERNAME with your actual username)

### App crashes on launch

1. Check Android Studio Logcat for errors
2. Verify Firebase config in `.env` file
3. Make sure you ran `npm run build` before syncing

### Web assets not updating

Always run `npm run cap:sync` after building:
```bash
npm run build && npm run cap:sync
```

## Next Steps

- [Android Studio Setup](./android-studio-setup.md) - Detailed setup guide
- [Build Guide](./build-guide.md) - Build release versions
- [Deployment Guide](./deployment.md) - Publish to Play Store

