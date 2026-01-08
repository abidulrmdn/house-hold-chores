# Test Missed Tasks Cloud Function

## Quick Test Guide

### Step 1: Create Test Overdue Routine

You have two options:

#### Option A: Use the Node.js Script (Recommended)

```bash
# Make sure you're logged in to Firebase
firebase login

# Set your project
firebase use your-project-id

# Run the script
node scripts/createTestOverdueRoutine.js
```

**Note:** If you get an error about credentials, you can:
1. Download serviceAccountKey.json from Firebase Console → Project Settings → Service Accounts
2. Place it in the project root
3. Or set: `export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccountKey.json"`

#### Option B: Manual Creation via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/) → Firestore Database
2. Create a routine in `routines` collection:
   ```json
   {
     "name": "Test Daily Routine (Overdue)",
     "categoryId": "your-category-id",
     "frequency": "daily",
     "assignedTo": ["kk1Pl9DSnjS5aA954MqMeOKVW9W2"],
     "householdId": "your-household-id",
     "createdBy": "kk1Pl9DSnjS5aA954MqMeOKVW9W2",
     "isActive": true,
     "createdAt": 1234567890000
   }
   ```

3. Create an overdue task in `taskInstances` collection:
   ```json
   {
     "routineId": "the-routine-id-from-step-2",
     "dueDate": 1704067200000,  // Yesterday's timestamp (calculate: new Date().setDate(new Date().getDate() - 1).setHours(0,0,0,0).getTime())
     "assignedTo": "kk1Pl9DSnjS5aA954MqMeOKVW9W2",
     "isCompleted": false,
     "missedCount": 0,
     "householdId": "your-household-id",
     "createdAt": 1234567890000
   }
   ```

### Step 2: Deploy the Cloud Function

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions:checkMissedTasks
```

### Step 3: Test the Function

#### Option A: Trigger Manually via Firebase Shell

```bash
firebase functions:shell
# Then in the shell:
checkMissedTasks()
```

#### Option B: Trigger via Firebase Console

1. Go to Firebase Console → Functions
2. Find `checkMissedTasks`
3. Click "Test function" or use the trigger button

#### Option C: Wait for Automatic Execution

The function runs automatically at 2 AM UTC daily.

### Step 4: Check Results

1. **Check logs:**
   ```bash
   firebase functions:log --only checkMissedTasks --limit 20
   ```

2. **Check Firestore:**
   - Go to Firebase Console → Firestore Database
   - Check `taskInstances` collection
   - The overdue task should have `isCompleted: true`
   - A new task should exist with `dueDate: today` and `missedCount: 1`

### Expected Results

✅ **Before function runs:**
- 1 incomplete task (due yesterday)
- `missedCount: 0`

✅ **After function runs:**
- Old task marked as `isCompleted: true`
- New task created (due today)
- New task has `missedCount: 1`

## Troubleshooting

### Script Fails with Credentials Error

The script needs Firebase Admin SDK credentials. Options:

1. **Use Firebase CLI (easiest):**
   ```bash
   firebase login
   firebase use your-project-id
   ```

2. **Download serviceAccountKey.json:**
   - Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `serviceAccountKey.json` in project root

3. **Set environment variable:**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccountKey.json"
   ```

### Function Not Found After Deployment

Make sure you deployed it:
```bash
firebase functions:list
```

If it's not there, deploy again:
```bash
cd functions && npm run build && cd ..
firebase deploy --only functions:checkMissedTasks
```

### Function Runs But No Changes

Check the logs for errors:
```bash
firebase functions:log --only checkMissedTasks --limit 50
```

Common issues:
- Task already exists (duplicate prevention working!)
- Routine not found
- Permission errors

