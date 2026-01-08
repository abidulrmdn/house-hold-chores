# Authentication Guide

This guide covers authentication setup and troubleshooting for the Household Routine Manager.

## Overview

The app supports two authentication methods:
- **Email/Password** - Traditional email and password sign-up/sign-in
- **Google Sign-In** - One-click Google authentication

## Quick Setup

### 1. Enable Authentication in Firebase

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable **Email/Password**
3. Enable **Google** (add your support email)

### 2. Configure Google Sign-In

#### For Web (Browser)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find or create **OAuth 2.0 Client ID** for **Web application**
4. Add authorized JavaScript origins:
   - `https://your-project-id.web.app`
   - `https://your-project-id.firebaseapp.com`
5. Add authorized redirect URIs:
   - `https://your-project-id.firebaseapp.com/__/auth/handler`
   - `https://your-project-id.web.app/__/auth/handler`
6. Copy the **Client ID** and add to `.env`:
   ```env
   VITE_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
   ```

#### For Android

1. Create Android app in Firebase Console (see [Android Firebase Setup](../android/firebase-setup.md))
2. Download `google-services.json` and place in `android/app/`
3. Add SHA-1 fingerprint in Firebase Console
4. The Android client ID is automatically configured via `google-services.json`

## Authentication Flow

### Web (Browser)

1. User clicks "Sign in with Google"
2. Popup window opens for Google authentication
3. User selects Google account
4. Firebase processes authentication
5. User is signed in

### Android (Native App)

1. User clicks "Sign in with Google"
2. Native Google Sign-In dialog appears
3. User selects Google account
4. Native plugin converts Google credentials to Firebase credentials
5. User is signed in

## Documentation

- **[Google Sign-In Setup](./google-signin-setup.md)** - Detailed Google Sign-In configuration
- **[Android Authentication](./android-auth.md)** - Android-specific authentication setup
- **[Troubleshooting](./troubleshooting.md)** - Common authentication issues

## Troubleshooting

### Google Sign-In Not Working

**Web:**
- Verify OAuth client ID is set in `.env`
- Check authorized origins/redirect URIs in Google Cloud Console
- Ensure Google Sign-In is enabled in Firebase Console

**Android:**
- Verify `google-services.json` is in `android/app/`
- Check SHA-1 fingerprint is added in Firebase Console
- Ensure native Google Auth plugin is installed

### Email/Password Not Working

- Verify Email/Password is enabled in Firebase Console
- Check Firebase config values in `.env`
- Check browser console for errors

### Authentication Errors

- Check Firebase Console → Authentication → Users for user creation
- Verify Firestore rules allow authenticated users
- Check browser/device console for detailed error messages

## Security Notes

- Never commit `.env` file to git
- Keep OAuth client IDs secure
- Use Firebase security rules to protect user data
- Only authenticated users can access app data

## Next Steps

- [Deployment Guide](../deployment/README.md) - Deploy your app
- [Android Setup](../android/README.md) - Set up Android app
- [Troubleshooting Guide](../troubleshooting/README.md) - Common issues

