# Troubleshooting: Unable to Create Household

## Common Issues & Solutions

### Issue 1: Firestore Database Not Created

**Symptom:** Error when trying to create household

**Solution:**
1. Go to: https://console.firebase.google.com/project/household-chores-d8eae/firestore
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose a location
5. Click **"Enable"**

### Issue 2: Authentication Not Enabled

**Symptom:** Permission denied errors

**Solution:**
1. Go to: https://console.firebase.google.com/project/household-chores-d8eae/authentication/providers
2. Enable **Email/Password**
3. Enable **Google**

### Issue 3: Not Signed In

**Symptom:** Can't create household, no user

**Solution:**
- Make sure you're signed in
- Check browser console for auth errors
- Try signing out and signing back in

### Issue 4: Firestore Rules Not Deployed

**Symptom:** Permission denied errors

**Solution:**
```bash
firebase deploy --only firestore:rules
```

## Check Browser Console

Open DevTools (F12) and check:
1. **Console tab** - Look for error messages
2. **Network tab** - Check if Firestore requests are failing

Common errors:
- `permission-denied` → Firestore rules or database not set up
- `unavailable` → Firestore database not created
- `not-found` → Firestore database not created

## Quick Fix Checklist

- [ ] Firestore database created in Console
- [ ] Authentication enabled (Email + Google)
- [ ] Signed in to the app
- [ ] Firestore rules deployed
- [ ] Check browser console for specific errors

## Test Steps

1. Open http://localhost:5173
2. Sign in (or sign up)
3. Try to create household
4. Check browser console (F12) for errors
5. Share the error message if it still doesn't work

