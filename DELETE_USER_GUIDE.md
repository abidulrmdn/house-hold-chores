# How to Delete a User

There are several ways to delete a user from Firebase. Choose the method that works best for your situation.

## Method 1: Firebase Console (Easiest - Manual)

### Delete from Authentication:
1. Go to [Firebase Console → Authentication → Users](https://console.firebase.google.com/project/household-chores-d8eae/authentication/users)
2. Find the user by email or UID
3. Click the three dots (⋮) next to the user
4. Click **"Delete user"**
5. Confirm deletion

### Delete from Firestore (if needed):
1. Go to [Firestore Database](https://console.firebase.google.com/project/household-chores-d8eae/firestore)
2. Navigate to `users` collection
3. Find the user document by UID
4. Click the document → Click **"Delete"**
5. Also delete related data:
   - Routines created by the user
   - Categories created by the user
   - Task instances assigned to the user
   - Remove user from household members

**Note:** This only deletes from Authentication. User data in Firestore remains unless manually deleted.

---

## Method 2: Using the Script (Recommended - Automated)

The project includes a script that can delete users programmatically.

### Prerequisites:
1. Install Firebase Admin SDK (if not already installed):
   ```bash
   npm install firebase-admin
   ```

2. Set up Application Default Credentials:
   ```bash
   # Option 1: Using gcloud CLI
   gcloud auth application-default login
   
   # Option 2: Using service account key file
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
   ```

### Usage:

**Delete user from Authentication only:**
```bash
npx ts-node scripts/deleteUser.ts user@example.com
# or
./scripts/deleteUser.sh user@example.com
```

**Delete user from both Authentication and Firestore:**
```bash
npx ts-node scripts/deleteUser.ts user@example.com --delete-firestore
# or
./scripts/deleteUser.sh user@example.com --delete-firestore
```

**Delete by UID:**
```bash
npx ts-node scripts/deleteUser.ts abc123xyz --delete-firestore
```

### What the script does:
- ✅ Finds user by email or UID
- ✅ Shows user information before deletion
- ✅ Asks for confirmation
- ✅ Deletes from Firebase Authentication
- ✅ (Optional) Deletes from Firestore:
  - User document
  - Routines created by user
  - Categories created by user
  - Task instances assigned to user
  - Removes user from household members

---

## Method 3: Programmatically in Your App

### Delete Current User (Self-Deletion):
```typescript
import { deleteUser } from 'firebase/auth'
import { auth } from '@/firebase/config'

const user = auth.currentUser
if (user) {
  try {
    await deleteUser(user)
    console.log('User deleted successfully')
  } catch (error) {
    console.error('Error deleting user:', error)
  }
}
```

### Delete User Data from Firestore:
```typescript
import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

// Delete user document
await deleteDoc(doc(db, 'users', userId))

// Delete user's routines
const routinesSnapshot = await getDocs(
  query(collection(db, 'routines'), where('createdBy', '==', userId))
)
routinesSnapshot.forEach(async (doc) => {
  await deleteDoc(doc.ref)
})
```

**Note:** Regular users can only delete themselves. Admin operations require Firebase Admin SDK.

---

## Method 4: Firebase CLI

```bash
# List users
firebase auth:export users.json --project household-chores-d8eae

# Delete user (requires Admin SDK)
# Use the script instead, as CLI doesn't have direct delete command
```

---

## Important Considerations

### ⚠️ What Gets Deleted:

**Authentication:**
- User account
- Email/password credentials
- OAuth providers linked to account

**Firestore (if using --delete-firestore):**
- User document
- Routines created by user
- Categories created by user
- Task instances assigned to user
- User removed from household members

### ⚠️ What Doesn't Get Deleted:
- Households owned by the user (you'll need to handle this manually)
- Historical data in other collections
- Files in Storage (if any)

### ⚠️ Household Ownership:
If the user is the owner of a household, the script will warn you. You may need to:
1. Transfer ownership to another member
2. Delete the household manually
3. Or handle this in your application logic

---

## Troubleshooting

### "User not found"
- Check if you're using the correct email or UID
- Verify the user exists in Firebase Console

### "Permission denied"
- Make sure you're using Firebase Admin SDK (not client SDK)
- Verify Application Default Credentials are set up correctly

### "Cannot delete user"
- User might be signed in elsewhere
- Try signing out the user first
- Check Firebase Console for any restrictions

---

## Quick Reference

| Method | Best For | Deletes Auth | Deletes Firestore |
|--------|----------|--------------|-------------------|
| Firebase Console | Quick manual deletion | ✅ | ❌ (manual) |
| Script | Automated deletion | ✅ | ✅ (optional) |
| Programmatic | Self-deletion in app | ✅ | ❌ (manual) |
| Firebase CLI | Bulk operations | ⚠️ | ❌ |

---

## Example: Complete User Deletion

```bash
# 1. Delete user and all their data
./scripts/deleteUser.sh user@example.com --delete-firestore

# 2. Verify deletion in Firebase Console
# Go to Authentication → Users (user should be gone)
# Go to Firestore → users collection (document should be gone)
```

