# Troubleshooting Guide

Common issues and solutions for the Household Routine Manager.

## Quick Fixes

### App Shows Empty Screen

**Problem:** App shows blank screen at `http://localhost:5173/`

**Solutions:**
1. Check you're using the correct port (5173, not 5174)
2. Open browser DevTools (F12) and check Console for errors
3. Check Network tab to see if files are loading
4. Restart dev server: `npm run dev`

### Firebase Not Configured Warning

**Problem:** Yellow warning banner saying "Firebase not configured"

**Solutions:**
1. Create `.env` file from `.env.example`
2. Fill in all Firebase configuration values
3. Restart dev server after creating/updating `.env`
4. Verify values match your Firebase project

### Port Already in Use

**Problem:** Server won't start or shows port error

**Solutions:**
```bash
# Kill existing Vite process
pkill -f vite

# Or use a different port
npm run dev -- --port 3000
```

### Module Not Found Errors

**Problem:** Console shows import errors

**Solutions:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Authentication Issues

### Google Sign-In Not Working

See [Authentication Troubleshooting](../authentication/troubleshooting.md)

### Email/Password Not Working

- Verify Email/Password is enabled in Firebase Console
- Check Firebase config values in `.env`
- Check browser console for errors

## Firebase Issues

### Firestore Permission Denied

**Problem:** "Firestore permission denied" errors

**Solutions:**
1. Deploy Firestore rules: `firebase deploy --only firestore:rules`
2. Check rules in `firestore.rules`
3. Verify user is authenticated
4. Check Firestore Console for error details

### Firestore Index Errors

**Problem:** Missing index errors

**Solutions:**
1. Firebase will provide a link to create missing indexes
2. Click the link and create the indexes
3. Or manually create in Firebase Console → Firestore → Indexes

### Authentication Errors

**Problem:** Firebase auth errors

**Solutions:**
- Check Firebase Console → Authentication → Users
- Verify authentication providers are enabled
- Check browser console for detailed error messages

## Build & Deployment Issues

### Build Fails

**Problem:** `npm run build` fails

**Solutions:**
1. Check all environment variables are set in `.env`
2. Run `npm install` again
3. Clear `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
4. Check for TypeScript errors: `npm run build`

### Deployment Errors

**Problem:** `firebase deploy` fails

**Solutions:**
1. Verify Firebase CLI is logged in: `firebase login`
2. Check you have permission to deploy
3. Verify project ID matches: `firebase projects:list`
4. Check Firebase Console for any issues

## Android Issues

### SDK Location Not Found

**Problem:** "SDK location not found" error

**Solutions:**
1. Create `android/local.properties`:
   ```properties
   sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
   ```
2. Or set in Android Studio: File → Project Structure → SDK Location

### App Crashes on Launch

**Problem:** Android app crashes immediately

**Solutions:**
1. Check Android Studio Logcat for errors
2. Verify Firebase config in `.env` file
3. Make sure you ran `npm run build` before syncing
4. Check `google-services.json` is in `android/app/`

### Web Assets Not Updating

**Problem:** Changes not appearing in Android app

**Solutions:**
1. Always run `npm run cap:sync` after building:
   ```bash
   npm run build && npm run cap:sync
   ```
2. Clear app data: Settings → Apps → Household Routine Manager → Clear Data

## Notification Issues

### Notifications Not Working

**Problem:** Push notifications not received

**Solutions:**
1. Verify VAPID key is set in `.env`
2. Update `public/firebase-messaging-sw.js` with Firebase config
3. Check browser console for errors
4. Make sure notification permissions are granted
5. Check Firebase Console → Cloud Messaging for errors

## Common Commands

```bash
# Restart dev server
npm run dev

# Clear and reinstall dependencies
rm -rf node_modules package-lock.json && npm install

# Build for production
npm run build

# Deploy Firestore rules
firebase deploy --only firestore:rules,firestore:indexes

# Sync Android
npm run cap:sync

# Clean Android build
cd android && ./gradlew clean
```

## Getting More Help

1. **Check browser console** (F12) for errors
2. **Check terminal output** for build errors
3. **Check Firebase Console** for service issues
4. **Review documentation**:
   - [Getting Started](../getting-started/README.md)
   - [Authentication Guide](../authentication/README.md)
   - [Android Guide](../android/README.md)
   - [Deployment Guide](../deployment/README.md)

## Still Having Issues?

If you're still stuck:
1. Check browser console errors
2. Check terminal output
3. Verify you're on the correct port (5173)
4. Share the error messages you see

