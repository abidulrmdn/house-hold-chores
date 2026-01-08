# Deploy Missed Tasks Cloud Function

## What Changed

The `checkAndUpdateMissedTasks` feature has been moved from local JavaScript (browser) to a **Cloud Function** that runs daily on Firebase servers.

## Benefits

✅ **Runs automatically** - Even when no one has the app open  
✅ **Runs once daily** - Instead of every minute, reducing load  
✅ **No duplicates** - Checks database before creating tasks  
✅ **More reliable** - Server-side execution, no browser dependency  

## Deployment Steps

### 1. Build the Functions

```bash
cd functions
npm install  # Make sure dependencies are installed
npm run build
```

### 2. Deploy the Function

```bash
# Deploy just the missed tasks function
firebase deploy --only functions:checkMissedTasks

# Or deploy all functions
firebase deploy --only functions
```

### 3. Verify Deployment

```bash
# Check function logs
firebase functions:log --only checkMissedTasks

# List all scheduled functions
firebase functions:list
```

## Schedule

The function runs **daily at 2:00 AM UTC** (adjust timezone as needed).

To change the schedule, edit `functions/src/index.ts`:

```typescript
.schedule('0 2 * * *') // 2 AM UTC every day
```

Cron format: `minute hour day month day-of-week`

Examples:
- `'0 2 * * *'` - 2 AM UTC daily
- `'0 3 * * *'` - 3 AM UTC daily  
- `'0 0 * * *'` - Midnight UTC daily

## Testing

### Test Manually (Optional)

You can test the function manually using Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Functions** → **checkMissedTasks**
4. Click **"Test function"** or use the trigger button

### Monitor Execution

Check logs to see if it's working:

```bash
firebase functions:log --only checkMissedTasks
```

You should see logs like:
```
Running missed tasks check job...
Found X active routines
Found Y incomplete tasks
Updated: Z, Created: W, Errors: 0
```

## What It Does

1. **Runs daily at 2 AM UTC**
2. **Finds all incomplete tasks** across all households
3. **Checks if tasks are overdue** (past their next due date)
4. **Marks old tasks as completed** (with missed count)
5. **Creates new task instances** for the next occurrence
6. **Prevents duplicates** by checking database first

## Local Code Changes

The local JavaScript version has been **removed** from:
- `src/pages/Dashboard.tsx` - No longer calls `checkAndUpdateMissedTasks()`
- The function still exists in `src/store/useRoutineStore.ts` but is no longer used

You can optionally remove the local function entirely if you want, but keeping it doesn't hurt (it's just not called anymore).

## Troubleshooting

### Function Not Running

1. **Check if deployed:**
   ```bash
   firebase functions:list
   ```

2. **Check logs:**
   ```bash
   firebase functions:log --only checkMissedTasks
   ```

3. **Verify schedule:**
   - Check cron expression in code
   - Make sure timezone is correct

### Still Getting Duplicates

1. **Make sure function is deployed** (not just local code)
2. **Check function logs** for errors
3. **Verify database queries** are working correctly

### Function Errors

Check logs for specific errors:
```bash
firebase functions:log --only checkMissedTasks --limit 50
```

Common issues:
- Missing Firestore indexes (should auto-create)
- Permission errors (check Firestore rules)
- Date/timezone issues

## Next Steps

After deploying:

1. ✅ Function will run automatically daily
2. ✅ No more local checking needed
3. ✅ Duplicates should stop appearing
4. ✅ Clean up existing duplicates using `CLEANUP_DUPLICATES.md`

