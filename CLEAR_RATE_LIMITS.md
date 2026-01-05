# Clear Rate Limits

To clear the rate limit data that's blocking requests:

## Option 1: Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/project/household-chores-d8eae/firestore)
2. Click on **Firestore Database**
3. Find the `rateLimits` collection
4. Select all documents
5. Click **Delete**

## Option 2: Wait 1 Hour

Rate limits automatically reset after 1 hour. Just wait and try again.

## Option 3: Delete via Code (Temporary)

You can temporarily add this to clear rate limits, then remove it:

```typescript
// In functions/src/index.ts - temporary helper function
export const clearRateLimits = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }
  
  const userId = context.auth.uid
  const batch = admin.firestore().batch()
  
  const collections = ['insights', 'suggestions', 'parse']
  for (const collection of collections) {
    const docRef = admin.firestore().collection('rateLimits').doc(`${collection}:${userId}`)
    batch.delete(docRef)
  }
  
  await batch.commit()
  return { success: true }
})
```

Then call it once, then remove the function.

