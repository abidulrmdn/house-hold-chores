# Cleanup Duplicate Tasks

## Problem

Due to a bug in the code, duplicate task instances were being created. The `checkAndUpdateMissedTasks` function was running every minute and creating new task instances without checking if they already existed.

## Fix Applied

I've fixed the code to check for existing tasks before creating new ones:
- `checkAndUpdateMissedTasks` now checks if a task already exists before creating a new one
- `generateTaskInstances` now checks for existing tasks before creating new ones

## Cleanup Existing Duplicates

You have two options to clean up existing duplicates:

### Option 1: Manual Cleanup via Firebase Console (Recommended for Small Amounts)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. Open the `taskInstances` collection
5. Look for tasks with the same:
   - `routineId`
   - `assignedTo`
   - `dueDate`
6. Delete the duplicates manually (keep the oldest one based on `createdAt`)

### Option 2: Script Cleanup (For Large Amounts)

If you have many duplicates, you can use the cleanup script:

1. **Download your service account key:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save it as `serviceAccountKey.json` in the project root

2. **Install dependencies:**
   ```bash
   npm install firebase-admin
   ```

3. **Run the cleanup script:**
   ```bash
   npx ts-node scripts/cleanupDuplicateTasks.ts
   ```

   **Note:** The script will:
   - Find all duplicate task instances (same routineId + assignedTo + dueDate)
   - Keep the oldest one (by createdAt)
   - Delete all duplicates

### Option 3: Quick Firestore Query (If you're comfortable with Firestore)

You can also write a Firestore query to find duplicates, but this requires more technical knowledge.

## Prevention

The code has been fixed, so new duplicates should not be created. The fixes include:

1. ✅ `checkAndUpdateMissedTasks` checks for existing tasks before creating new ones
2. ✅ `generateTaskInstances` checks for existing tasks before creating new ones

## Verification

After cleanup, you should see:
- Normal number of tasks (not thousands)
- "This Week" tab showing correct counts
- No duplicate tasks for the same routine/user/date

## Need Help?

If you need help cleaning up duplicates, let me know and I can:
1. Create a simpler cleanup script
2. Help you identify which tasks are duplicates
3. Provide a step-by-step guide for your specific situation

