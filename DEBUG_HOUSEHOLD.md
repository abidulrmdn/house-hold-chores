# Debug: Household Not Found

## Issue
Getting "Household not found" when trying to join.

## How Households Work

Households are created with the **creator's user ID** as the document ID.

For example:
- User ID: `kk1Pl9DSnjS5aA954MqMeOKVW9W2`
- Household ID: `kk1Pl9DSnjS5aA954MqMeOKVW9W2` (same as user ID)

## Check if Household Exists

1. Go to Firebase Console: https://console.firebase.google.com/project/household-chores-d8eae/firestore
2. Navigate to `households` collection
3. Look for a document with ID: `kk1Pl9DSnjS5aA954MqMeOKVW9W2`

## Possible Issues

### 1. Household Not Created
- The household creator might not have completed the household creation
- Check if the creator has a `householdId` in their user document

### 2. Wrong Household ID
- The invite link might have the wrong ID
- Verify the ID matches the creator's user ID

### 3. Firestore Not Set Up
- Make sure Firestore database is created
- Check if other collections exist (users, routines, etc.)

## How to Fix

### Option 1: Verify Household Exists
1. Sign in as the household creator
2. Check if they have a household
3. Get the correct household ID from the invite modal

### Option 2: Create Household First
If the household doesn't exist:
1. Sign in as the person who should create it
2. Create a household
3. Share the new invite link

### Option 3: Check Browser Console
Open browser console (F12) and look for:
- "Looking up household: ..."
- "Household document does not exist: ..."
- Any Firestore errors

## Test

1. Sign in as the household creator
2. Click "Invite" button
3. Copy the Household ID
4. Try joining with that ID
5. Check browser console for detailed logs

