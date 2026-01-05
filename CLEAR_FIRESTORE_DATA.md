# Clear Firestore Data

This guide provides multiple ways to delete routine-related data from Firestore.

## ⚠️ WARNING

**These operations are irreversible!** Make sure you have a backup or are certain you want to delete the data.

## Option 1: Firebase Console (Easiest - No Code Required)

### Delete Task Instances Only

1. Go to [Firebase Console](https://console.firebase.google.com/project/household-chores-d8eae/firestore)
2. Navigate to **Firestore Database**
3. Click on the `taskInstances` collection
4. Click **Select all** (or select specific documents)
5. Click **Delete**
6. Confirm deletion

### Delete All Routine Data

Repeat the above steps for:
- `taskInstances` collection
- `routines` collection
- `categories` collection (optional)

**Note:** This preserves `households` and `users` collections.

## Option 2: Firebase CLI (Recommended for Bulk Deletion)

### Prerequisites

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Make sure you're in the project directory
cd /path/to/household-routine-manager
```

### Delete Task Instances Only

```bash
# Use Firebase CLI to delete all documents in taskInstances collection
firebase firestore:delete --recursive --yes taskInstances
```

### Delete All Routine Data

```bash
# Delete task instances
firebase firestore:delete --recursive --yes taskInstances

# Delete routines
firebase firestore:delete --recursive --yes routines

# Delete categories (optional)
firebase firestore:delete --recursive --yes categories
```

## Option 3: Node.js Script (Most Control)

### Setup

1. Install dependencies:
```bash
npm install firebase-admin
```

2. Authenticate with Firebase:
```bash
firebase login
```

3. Run the script:
```bash
npx ts-node scripts/clearAllRoutineData.ts
```

The script will:
- Show you how many documents will be deleted
- Ask for confirmation
- Delete documents in batches (Firestore limit: 500 per batch)
- Optionally delete categories

## Option 4: Cloud Function (For Production)

You can create a Cloud Function to delete data. However, this is not recommended for production use as it's a destructive operation.

## What Gets Deleted

### Task Instances Only
- ✅ All `taskInstances` documents
- ❌ Routines (preserved)
- ❌ Categories (preserved)
- ❌ Households (preserved)
- ❌ Users (preserved)

### All Routine Data
- ✅ All `taskInstances` documents
- ✅ All `routines` documents
- ✅ All `categories` documents (optional)
- ❌ Households (preserved)
- ❌ Users (preserved)

## After Deletion

After clearing the data:

1. **Routines will remain** but won't have any task instances
2. **New task instances will be generated** when you complete existing tasks or when routines generate new instances
3. **You can manually trigger task generation** by completing a task or editing a routine

## Regenerating Task Instances

If you want to regenerate task instances for existing routines:

1. Edit each routine (this will trigger task instance generation)
2. Or wait for the next scheduled task generation
3. Or complete an existing task (this generates the next instance)

## Safety Tips

1. **Backup first**: Export your Firestore data before deletion
   ```bash
   firebase firestore:export gs://your-bucket/backup
   ```

2. **Test in development**: Try deletion in a test project first

3. **Use filters**: In Firebase Console, you can filter by date or other fields to delete specific subsets

4. **Check counts**: Always verify the number of documents before deletion

## Troubleshooting

### "Permission denied" error
- Make sure you're logged in: `firebase login`
- Check that your Firebase project is selected: `firebase use household-chores-d8eae`

### Script errors
- Make sure `firebase-admin` is installed: `npm install firebase-admin`
- Check that you're using Node.js 18+ or 20+

### Documents not deleting
- Check Firestore security rules allow deletion
- Verify you have the correct permissions in Firebase Console

