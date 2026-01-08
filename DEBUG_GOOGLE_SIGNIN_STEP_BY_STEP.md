# Step-by-Step Google Sign-In Debugging Guide

## Overview
This guide will help us debug the Google Sign-In flow step by step. We'll verify each step manually to identify where the issue occurs.

## Prerequisites
- Android device/emulator with the app installed
- `adb` connected and working
- Logcat access

---

## Step 1: Verify Initial State

**What to check:** Make sure the app starts cleanly

**Actions:**
1. Clear app data: `adb shell pm clear com.household.routinemanager`
2. Open the app
3. Check logcat for: `[AUTH]` logs

**Expected logs:**
```
[AUTH] No redirect result found
```

**What to report:**
- [ ] App opens successfully
- [ ] No errors in logcat
- [ ] Sign-in button is visible

---

## Step 2: Initiate Google Sign-In

**What to check:** Verify the sign-in button triggers correctly

**Actions:**
1. Tap "Sign in with Google" button
2. Watch logcat immediately
3. **IMPORTANT:** Watch for any errors or unexpected behavior

**Expected logs:**
```
[AUTH] Starting Google Sign-In...
[AUTH] Auth instance: exists
[AUTH] Google provider: exists
[AUTH] Current URL before redirect: https://localhost/
[AUTH] Current origin: https://localhost
[AUTH] Calling signInWithRedirect...
[AUTH] Expected redirect URL: https://household-chores-d8eae.firebaseapp.com/__/auth/handler
```

**Expected behavior:**
- Browser/Chrome Custom Tabs should open
- OR Android account picker might appear (if Google account is already signed in)

**If browser doesn't open, check for:**
- Any error logs after `[AUTH] Calling signInWithRedirect...`
- Does the sign-in button stop spinning?
- Does an alert appear?

**What to report:**
- [ ] Does the log `[AUTH] Starting Google Sign-In...` appear? Yes/No
- [ ] Do ALL the expected logs appear? Yes/No (list which ones are missing)
- [ ] Does the browser/Chrome open? Yes/No
- [ ] Does Android account picker appear instead? Yes/No
- [ ] Does the sign-in button keep spinning? Yes/No
- [ ] Does an alert/error message appear? Yes/No (what does it say?)
- [ ] What happens after tapping the button? (Describe exactly what you see)
- [ ] Are there any error logs? Yes/No (paste them here)

---

## Step 3: Verify Browser Opens

**What to check:** Google authentication page opens

**Actions:**
1. After tapping sign-in, check if browser opens
2. Check what URL is shown in the browser address bar

**Expected behavior:**
- Browser should open
- URL should be `accounts.google.com` or similar
- You should see Google sign-in page

**What to report:**
- [ ] Browser opens: Yes/No
- [ ] Browser URL: `_________________`
- [ ] Can you see Google sign-in page? Yes/No

---

## Step 4: Complete Google Authentication

**What to check:** User authenticates with Google

**Actions:**
1. Sign in with your Google account
2. Grant permissions if asked
3. Watch what happens after clicking "Allow" or "Continue"

**Expected behavior:**
- After authentication, browser should redirect
- You should see a redirect happening

**What to report:**
- [ ] Authentication successful: Yes/No
- [ ] After clicking "Allow", what URL does browser redirect to? `_________________`
- [ ] Does the app open automatically? Yes/No
- [ ] If app opens, what screen do you see?

---

## Step 5: Check Deep Link Interception

**What to check:** Verify Android intercepts the Firebase URL

**Actions:**
1. After Google authentication, watch logcat
2. Look for `[AUTH] Deep link received:` log

**Expected logs:**
```
[AUTH] Deep link received: https://household-chores-d8eae.firebaseapp.com/__/auth/handler?...
```

**What to report:**
- [ ] Does `[AUTH] Deep link received:` appear in logcat? Yes/No
- [ ] If yes, what URL is shown? `_________________`
- [ ] Does it contain `__/auth/handler`? Yes/No
- [ ] Does it contain `firebaseapp.com` or `web.app`? Yes/No

---

## Step 6: Verify Navigation to Firebase URL

**What to check:** App navigates to Firebase domain

**Actions:**
1. After deep link is received, check logcat for navigation log
2. Check if app's URL changes

**Expected logs:**
```
[AUTH] Firebase Auth URL detected - navigating to process...
```

**What to report:**
- [ ] Does `[AUTH] Firebase Auth URL detected - navigating to process...` appear? Yes/No
- [ ] Does the app screen change/flash? Yes/No
- [ ] What does the app screen show? (Describe)

---

## Step 7: Check Return to App

**What to check:** App returns to localhost after Firebase processes redirect

**Actions:**
1. After navigation, wait 2-3 seconds
2. Check logcat for return message
3. Check if app is back on sign-in screen

**Expected logs:**
```
[AUTH] Returned from Firebase - checking result...
[AUTH] Checking redirect result...
```

**What to report:**
- [ ] Does `[AUTH] Returned from Firebase - checking result...` appear? Yes/No
- [ ] Does `[AUTH] Checking redirect result...` appear? Yes/No
- [ ] What screen is the app showing now?
- [ ] Is the sign-in button still spinning? Yes/No

---

## Step 8: Verify Authentication Result

**What to check:** Check if `getRedirectResult()` finds the result

**Actions:**
1. After checking redirect result, look for success/failure logs
2. Check if user is signed in

**Expected logs (SUCCESS):**
```
[AUTH] ✅ Sign-in successful! User: your@email.com
```

**Expected logs (FAILURE):**
```
[AUTH] No redirect result found
```

**What to report:**
- [ ] Which log appears? (Success or No redirect result)
- [ ] If success, what email is shown?
- [ ] If failure, does the button stop spinning?
- [ ] Is the user signed in? Yes/No

---

## Step 9: Manual Verification Checks

**What to check:** Verify configuration manually

### Check 9.1: localStorage
**Actions:**
1. In logcat, search for `localStorage`
2. Or use Chrome DevTools if accessible

**What to report:**
- [ ] Is `firebase_auth_pending_url` stored in localStorage? Yes/No
- [ ] If yes, what value? `_________________`

### Check 9.2: Current URL
**Actions:**
1. Add temporary log: `console.log('CURRENT URL:', window.location.href)`
2. Check logcat after app returns

**What to report:**
- [ ] What is `window.location.href`? `_________________`
- [ ] What is `window.location.origin`? `_________________`

### Check 9.3: Firebase Auth State
**Actions:**
1. Check logcat for Firebase auth state changes
2. Look for `onAuthStateChanged` logs

**What to report:**
- [ ] Does `onAuthStateChanged` fire? Yes/No
- [ ] If yes, what user is returned? `_________________`

---

## Step 10: Verify Redirect URL Configuration

**What to check:** Make sure Firebase can construct the redirect URL correctly

**Actions:**
1. Check your `.env` file - what is `VITE_FIREBASE_AUTH_DOMAIN`?
2. Expected value: `household-chores-d8eae.firebaseapp.com` or `household-chores-d8eae.web.app`
3. Check logcat for: `[AUTH] Expected redirect URL:`

**What to report:**
- [ ] What is `VITE_FIREBASE_AUTH_DOMAIN` in `.env`? `_________________`
- [ ] What does `[AUTH] Expected redirect URL:` show in logcat? `_________________`
- [ ] Do they match? Yes/No

## Step 11: Test Chrome Custom Tabs Availability

**What to check:** Verify Android can open Chrome Custom Tabs

**Actions:**
1. Run this command to test if Chrome can open URLs:
   ```bash
   adb shell am start -a android.intent.action.VIEW -d "https://www.google.com"
   ```
2. Does Chrome/browser open? Yes/No

**What to report:**
- [ ] Does Chrome open when running the test command? Yes/No
- [ ] If no, what happens? `_________________`

## Step 12: Alternative Test - Direct Firebase Auth URL Test

**What to check:** Test if Firebase Auth handler URL works

**Actions:**
1. Get your Firebase API key from `.env` file (`VITE_FIREBASE_API_KEY`)
2. Run this command (replace YOUR_API_KEY):
   ```bash
   adb shell am start -a android.intent.action.VIEW -d "https://household-chores-d8eae.firebaseapp.com/__/auth/handler?apiKey=YOUR_API_KEY&authType=signInViaRedirect&providerId=google.com&redirectUrl=https://localhost/"
   ```

**What to report:**
- [ ] Does the app open? Yes/No
- [ ] What logs appear? `_________________`
- [ ] Does it show any errors? Yes/No
- [ ] What screen does the app show? `_________________`

---

## Summary Questions

After completing all steps, please answer:

1. **At which step does the flow break?** (Step number: _____)

2. **What is the exact error or unexpected behavior?**
   ```
   
   ```

3. **What logs appear right before the issue?**
   ```
   
   ```

4. **Does the app navigate to Firebase URL?** (Yes/No/Not sure)

5. **Does the app return from Firebase URL?** (Yes/No/Not sure)

6. **What is the final state?**
   - [ ] User is signed in successfully
   - [ ] Sign-in button keeps spinning
   - [ ] App shows error message
   - [ ] App crashes
   - [ ] Other: `_________________`

---

## Quick Test Commands

Run these commands and report the output:

```bash
# Check if app is installed
adb shell pm list packages | grep household

# Check app links
adb shell pm get-app-links com.household.routinemanager

# Clear app data and restart
adb shell pm clear com.household.routinemanager
adb shell am start -n com.household.routinemanager/.MainActivity

# Monitor logcat (run in separate terminal)
adb logcat | grep -E "AUTH|Capacitor|Firebase"
```

---

## Next Steps

After you complete these steps and report back, we'll:
1. Analyze where the flow breaks
2. Fix the specific issue
3. Test the fix
4. Deploy if successful

**Please complete Steps 1-8 first, then report back with your findings!**

