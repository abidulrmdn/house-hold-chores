# Gemini API Setup Guide

## Step 1: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key (you'll need this for Firebase Functions)

## Step 2: Set Up Firebase Functions

### Install Functions Dependencies

```bash
cd functions
npm install
```

### Configure API Key

You have two options:

#### Option A: Using Firebase Functions Config (Recommended for Production)

```bash
firebase functions:config:set gemini.api_key="YOUR_API_KEY_HERE"
```

#### Option B: Using Environment Variables (For Local Development)

Create `functions/.env` file:
```
GEMINI_API_KEY=YOUR_API_KEY_HERE
```

Then update `functions/src/index.ts` to use:
```typescript
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || functions.config().gemini?.api_key || ''
)
```

## Step 3: Build and Deploy Functions

```bash
# Build functions
cd functions
npm run build

# Deploy to Firebase
firebase deploy --only functions
```

## Step 4: Test the Integration

1. Open your app
2. You should see "AI Task Suggestions" section
3. Click "Get Suggestions" to test
4. Check browser console for any errors

## Troubleshooting

### Error: "Gemini API not configured"
- Make sure you've set the API key using one of the methods above
- Redeploy functions after setting the key

### Error: "Functions not found"
- Make sure you've deployed functions: `firebase deploy --only functions`
- Check that functions are enabled in Firebase Console

### Error: "Permission denied"
- Make sure you're authenticated
- Check Firestore security rules allow function calls

## Cost

- **Free Tier**: 15 requests/minute, 1,500 requests/day
- **Paid**: Very affordable (~$0-5/month for typical usage)
- Monitor usage in [Google Cloud Console](https://console.cloud.google.com/)

## Security Notes

- Never commit API keys to git
- Use Firebase Functions config for production
- The API key is server-side only (in Cloud Functions)

