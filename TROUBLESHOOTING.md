# Troubleshooting Guide

## Empty Screen Issue

### Problem: App shows empty screen at `http://localhost:5174/`

**Solution:** The dev server runs on port **5173**, not 5174!

1. **Check the correct port:**
   - Open `http://localhost:5173` (not 5174)
   - Or check the terminal output when you run `npm run dev`
   - Vite will show: `Local: http://localhost:5173/`

2. **If still empty screen:**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab to see if files are loading

### Common Issues:

#### 1. Firebase Not Configured
**Symptom:** Empty screen or console errors about Firebase

**Solution:**
- The app should still show the auth page even without Firebase
- If you see a warning banner, that's normal
- To fix: Create `.env` file with Firebase config (see README.md)

#### 2. Port Already in Use
**Symptom:** Server won't start or shows port error

**Solution:**
```bash
# Kill existing Vite process
pkill -f vite

# Or use a different port
npm run dev -- --port 3000
```

#### 3. Module Not Found Errors
**Symptom:** Console shows import errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 4. TypeScript Errors
**Symptom:** Build fails or shows TS errors

**Solution:**
```bash
# Check for errors
npm run build

# Fix any type errors shown
```

## Quick Fixes

### Restart Dev Server
```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

### Clear Cache
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red errors
4. Share errors if you need help

## Expected Behavior

### Without Firebase Config:
- ✅ App should load and show auth page
- ✅ Yellow warning banner at top: "Firebase not configured"
- ✅ Auth buttons visible but won't work
- ✅ No crashes or empty screens

### With Firebase Config:
- ✅ Full authentication working
- ✅ Can sign up/sign in
- ✅ Dashboard loads after login
- ✅ All features functional

## Still Having Issues?

1. **Check terminal output:**
   ```bash
   npm run dev
   ```
   Look for any error messages

2. **Check browser console:**
   - Open DevTools (F12)
   - Check Console for errors
   - Check Network tab for failed requests

3. **Verify files exist:**
   ```bash
   ls -la src/
   ls -la index.html
   ```

4. **Try building:**
   ```bash
   npm run build
   ```
   This will show any build errors

## Getting Help

If you're still stuck:
1. Check browser console errors
2. Check terminal output
3. Verify you're on the correct port (5173)
4. Share the error messages you see

