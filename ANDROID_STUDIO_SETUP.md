# Step-by-Step: Opening in Android Studio

## Prerequisites Checklist

Before starting, make sure you have:

- [ ] **Android Studio installed** (download from https://developer.android.com/studio)
- [ ] **Android SDK installed** (comes with Android Studio)
- [ ] **Java Development Kit (JDK) 17+** (usually included with Android Studio)
- [ ] **Node.js 18+** installed (you already have this ✅)

---

## Step 1: Build Your Web App

First, build your web application so Android can use the latest code:

```bash
npm run build
```

**Expected output:** You should see "built in X.XXs" and a `dist/` folder created.

---

## Step 2: Sync to Android

Sync the built web assets to the Android project:

```bash
npm run cap:sync
```

**Expected output:** You should see:
```
✔ Copying web assets from dist to android/app/src/main/assets/public
✔ Creating capacitor.config.json
✔ Sync finished in X.XXs
```

**💡 Tip:** You can combine steps 1 & 2 with: `npm run cap:build`

---

## Step 3: Open Android Studio

### Option A: Using Command Line (Easiest)

```bash
npm run cap:open:android
```

This will automatically launch Android Studio and open the project.

### Option B: Manual Opening

1. **Launch Android Studio**
   - Open Android Studio application
   - If this is your first time, complete the setup wizard

2. **Open Project**
   - Click **"Open"** or **"Open an Existing Project"**
   - Navigate to your project folder: `/Users/abidul.ramadan/household-routine-manager`
   - **Important:** Select the `android` folder (not the root folder)
   - Click **"OK"**

   **Correct path:** `/Users/abidul.ramadan/household-routine-manager/android`

---

## Step 4: Wait for Gradle Sync

When Android Studio opens:

1. **Gradle Sync will start automatically**
   - You'll see "Gradle Sync" in the bottom status bar
   - This downloads dependencies and sets up the project
   - **First time can take 5-10 minutes** (downloading Android SDK components)

2. **What to expect:**
   - Progress bar at the bottom showing "Indexing..." or "Gradle Sync"
   - You may see popups asking to accept licenses - click **"Accept"**
   - Terminal/Event Log at bottom may show download progress

3. **When it's done:**
   - Status bar will show "Gradle Sync finished"
   - No error messages in the "Build" tab

---

## Step 5: Configure SDK Location (If Needed)

If you see an error like "SDK location not found":

1. Go to **File → Project Structure** (or press `Cmd + ;` on Mac)
2. Click **"SDK Location"** tab
3. Set SDK location to: `/Users/YOUR_USERNAME/Library/Android/sdk`
   - Replace `YOUR_USERNAME` with your Mac username
   - Or click "..." to browse and find it
4. Click **"Apply"** and **"OK"**
5. Gradle will sync again

**Alternative:** Create `android/local.properties` file manually:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

---

## Step 6: Set Up Device/Emulator

### Option A: Use Physical Android Device

1. **Enable USB Debugging on your phone:**
   - Go to **Settings → About Phone**
   - Tap **"Build Number"** 7 times (enables Developer Options)
   - Go back → **Developer Options**
   - Enable **"USB Debugging"**
   - Connect phone via USB cable

2. **Trust computer:**
   - When you connect, phone will ask "Allow USB debugging?"
   - Check **"Always allow from this computer"**
   - Click **"Allow"**

3. **In Android Studio:**
   - Your device should appear in the device dropdown (top toolbar)
   - It will show as something like "Pixel 5" or your phone model

### Option B: Create Android Emulator

1. **Open AVD Manager:**
   - Click **"Device Manager"** tab (usually on right side)
   - Or **Tools → Device Manager**

2. **Create Virtual Device:**
   - Click **"Create Device"**
   - Choose a device (e.g., **Pixel 5**)
   - Click **"Next"**

3. **Select System Image:**
   - Choose a system image (e.g., **API 33** or **API 34**)
   - If not downloaded, click **"Download"** next to it
   - Click **"Next"**

4. **Finish Setup:**
   - Name your emulator (e.g., "Pixel 5 API 33")
   - Click **"Finish"**

5. **Start Emulator:**
   - Click the **▶️ Play button** next to your emulator
   - Wait for it to boot (first time takes a few minutes)

---

## Step 7: Run the App

1. **Select your device:**
   - In the top toolbar, click the device dropdown
   - Select your connected phone or running emulator

2. **Run the app:**
   - Click the green **▶️ Run** button (or press `Shift + F10`)
   - Or go to **Run → Run 'app'**

3. **What happens:**
   - Android Studio will build the app (first build takes 2-5 minutes)
   - You'll see "Building..." in the bottom status bar
   - App will install on your device/emulator
   - App will launch automatically

---

## Step 8: Verify It Works

When the app launches, you should see:

- ✅ Your Household Routine Manager app
- ✅ Login/Authentication screen
- ✅ All features working (same as web version)

**If you see errors:**
- Check the **Logcat** tab at the bottom for error messages
- Make sure Firebase config is set in `.env` file
- Verify you ran `npm run build` before syncing

---

## Common Issues & Solutions

### Issue: "SDK location not found"

**Solution:**
1. File → Project Structure → SDK Location
2. Set SDK path: `/Users/YOUR_USERNAME/Library/Android/sdk`
3. Or create `android/local.properties` with:
   ```properties
   sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
   ```

### Issue: "Gradle sync failed"

**Solution:**
1. File → Invalidate Caches / Restart
2. Select "Invalidate and Restart"
3. Wait for Android Studio to restart and sync again

### Issue: "Build failed" or "Cannot resolve symbol"

**Solution:**
1. File → Sync Project with Gradle Files
2. Or run: `cd android && ./gradlew clean`
3. Then sync again in Android Studio

### Issue: "Duplicate class kotlin.collections.jdk8" or Kotlin stdlib errors

**Solution:**
This is already fixed in the build.gradle files. If you still see it:
1. File → Sync Project with Gradle Files
2. Build → Clean Project
3. Build → Rebuild Project
4. The fix excludes old kotlin-stdlib-jdk7 and kotlin-stdlib-jdk8 modules

### Issue: App crashes on launch

**Solution:**
1. Check **Logcat** tab for error messages
2. Verify Firebase config in `.env` file
3. Make sure you ran `npm run build` before `npm run cap:sync`
4. Try: `npm run cap:build` to rebuild and sync

### Issue: Device not showing up

**Solution:**
1. Enable USB debugging on phone
2. Trust computer when prompted
3. In Android Studio: **Tools → Device Manager** → Refresh
4. Or unplug and replug USB cable

### Issue: Emulator won't start

**Solution:**
1. Make sure virtualization is enabled in BIOS (for Intel Macs)
2. For Apple Silicon Macs, use ARM64 system images
3. Check **Tools → SDK Manager** → SDK Tools → Intel x86 Emulator Accelerator

---

## Quick Reference Commands

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

---

## Project Structure in Android Studio

When opened, you'll see:

```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/household/routinemanager/
│   │       │   └── MainActivity.java  ← Native Android code
│   │       ├── res/                  ← Icons, splash screens
│   │       └── AndroidManifest.xml   ← App permissions & config
│   └── build.gradle                  ← Build configuration
├── build.gradle                      ← Project-level config
└── settings.gradle                   ← Project settings
```

---

## Next Steps After Opening

1. ✅ **Test on device/emulator** - Make sure everything works
2. ⏭️ **Customize app icons** - Replace default icons
3. ⏭️ **Build release APK** - For distribution
4. ⏭️ **Publish to Play Store** - See ANDROID_BUILD_GUIDE.md

---

## Need Help?

- Check **Logcat** tab for runtime errors
- Check **Build** tab for build errors
- See `ANDROID_BUILD_GUIDE.md` for detailed build instructions
- See `ANDROID_QUICK_START.md` for quick commands

---

**Ready?** Run these commands:

```bash
npm run cap:build
npm run cap:open:android
```

Then follow steps 6-8 above to run on your device! 🚀

