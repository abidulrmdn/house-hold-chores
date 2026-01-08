# Deployment Guide

This guide covers deploying the Household Routine Manager to production.

## Prerequisites

Before deploying, ensure you have:
- ✅ Firebase project set up (see [Firebase Setup](../getting-started/firebase-setup.md))
- ✅ All environment variables configured in `.env`
- ✅ Firestore rules and indexes deployed
- ✅ Tested the app locally

## Quick Deployment

### Step 1: Build the Project

```bash
npm run build
```

This creates an optimized `dist` folder with production-ready files.

### Step 2: Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

Your app will be live at:
- `https://your-project-id.web.app`
- `https://your-project-id.firebaseapp.com`

## Detailed Deployment Steps

### 1. Install Firebase CLI

If you haven't already:

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

This opens a browser window for authentication.

### 3. Initialize Firebase (First Time Only)

```bash
firebase init
```

Select:
- ✅ **Firestore**: Configure security rules and indexes files
- ✅ **Hosting**: Configure files for Firebase Hosting

When prompted:
- Select your Firebase project
- Use default file names (`firestore.rules`, `firestore.indexes.json`)
- Use `dist` as your public directory
- Configure as single-page app: **Yes**
- Set up automatic builds: **No** (for now)

### 4. Deploy Firestore Rules and Indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

This ensures your database security rules and indexes are set up correctly.

### 5. Build the Project

```bash
npm run build
```

This creates the `dist` folder with optimized production files.

### 6. Deploy to Hosting

```bash
firebase deploy --only hosting
```

### 7. Verify Deployment

Visit your app URLs:
- `https://your-project-id.web.app`
- `https://your-project-id.firebaseapp.com`

## Updating Production

After making changes:

```bash
# 1. Build
npm run build

# 2. Deploy
firebase deploy --only hosting
```

## Deploy Specific Services

You can deploy individual services:

```bash
# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Firestore indexes
firebase deploy --only firestore:indexes

# Deploy everything
firebase deploy
```

## Alternative Hosting Options

### Vercel

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### GitHub Pages

1. Build: `npm run build`
2. Deploy `dist` folder to GitHub Pages
3. Configure base path in `vite.config.ts`

## PWA Icons (Optional but Recommended)

To add custom icons:

1. Create two PNG images:
   - `public/pwa-192x192.png` (192x192 pixels)
   - `public/pwa-512x512.png` (512x512 pixels)

2. Rebuild and redeploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## Environment Variables in Production

For production deployments, ensure:
- `.env` file is NOT committed to git (it's in `.gitignore`)
- Environment variables are set in your hosting platform if needed
- Firebase config is properly set in `public/firebase-messaging-sw.js`

## CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

### Firebase GitHub Integration

1. Go to Firebase Console → Hosting
2. Click "Connect GitHub repository"
3. Follow the setup wizard
4. Configure automatic deployments

## Troubleshooting

### Build Errors

- Make sure all environment variables are set
- Check that all dependencies are installed: `npm install`
- Clear node_modules and reinstall if needed: `rm -rf node_modules && npm install`

### Deployment Errors

- Verify Firebase CLI is logged in: `firebase login`
- Check that you have permission to deploy
- Verify project ID matches: `firebase projects:list`

### Firestore Index Errors

If you see index errors, Firebase will provide a link to create the missing indexes. Click the link and create them.

### Authentication Not Working in Production

- Make sure Email/Password and Google sign-in are enabled in Firebase Console
- Check that your `VITE_FIREBASE_AUTH_DOMAIN` matches your project
- Verify authorized domains in Firebase Console → Authentication → Settings

### Notifications Not Working

- Make sure you've added the VAPID key to `.env`
- Update `public/firebase-messaging-sw.js` with your Firebase config
- Check browser console for errors
- Make sure notification permissions are granted

## Free Tier Limits

Firebase free tier (Spark plan) includes:
- **Authentication**: Unlimited
- **Firestore**: 50K reads, 20K writes, 20K deletes per day
- **Hosting**: 10 GB storage, 360 MB/day transfer
- **Cloud Messaging**: Unlimited

This should be sufficient for a small household app. Monitor usage in Firebase Console.

## Security Notes

- Never commit `.env` file to git (it's in `.gitignore`)
- Firestore rules are deployed and protect your data
- Only authenticated users can access data
- Users can only modify their own data and household data

## Next Steps

- [Android App Deployment](../android/deployment.md)
- [Cloud Functions Deployment](./cloud-functions.md)
- [Monitoring and Analytics](./monitoring.md)

