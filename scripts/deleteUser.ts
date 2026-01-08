/**
 * Script to delete a user from Firebase Authentication and optionally Firestore
 * 
 * Usage:
 *   npx tsx scripts/deleteUser.ts <user-email-or-uid> [--delete-firestore]
 * 
 * Examples:
 *   npx tsx scripts/deleteUser.ts user@example.com
 *   npx tsx scripts/deleteUser.ts abc123xyz --delete-firestore
 */

import admin from 'firebase-admin'
import * as readline from 'readline'

// Initialize Firebase Admin
if (!admin.apps || admin.apps.length === 0) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    })
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error)
    console.error('\nMake sure you have:')
    console.error('1. Firebase Admin SDK installed: npm install firebase-admin')
    console.error('2. Application Default Credentials set up:')
    console.error('   gcloud auth application-default login')
    console.error('   OR set GOOGLE_APPLICATION_CREDENTIALS environment variable')
    process.exit(1)
  }
}

const auth = admin.auth()
const db = admin.firestore()

async function findUserByIdentifier(identifier: string): Promise<admin.auth.UserRecord | null> {
  try {
    // Try as UID first
    try {
      const user = await auth.getUser(identifier)
      return user
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Try as email
        try {
          const user = await auth.getUserByEmail(identifier)
          return user
        } catch (emailError: any) {
          if (emailError.code === 'auth/user-not-found') {
            return null
          }
          throw emailError
        }
      }
      throw error
    }
  } catch (error: any) {
    console.error('Error finding user:', error.message)
    return null
  }
}

async function deleteUserFromAuth(uid: string): Promise<boolean> {
  try {
    await auth.deleteUser(uid)
    console.log(`✅ User deleted from Firebase Authentication`)
    return true
  } catch (error: any) {
    console.error(`❌ Error deleting user from Auth:`, error.message)
    return false
  }
}

async function deleteUserFromFirestore(uid: string): Promise<boolean> {
  try {
    const batch = db.batch()
    
    // Delete user document
    const userRef = db.collection('users').doc(uid)
    const userDoc = await userRef.get()
    
    if (userDoc.exists) {
      batch.delete(userRef)
      console.log(`  - Deleting user document from Firestore`)
    }
    
    // Delete user's routines
    const routinesSnapshot = await db.collection('routines')
      .where('createdBy', '==', uid)
      .get()
    
    routinesSnapshot.forEach(doc => {
      batch.delete(doc.ref)
      console.log(`  - Deleting routine: ${doc.id}`)
    })
    
    // Delete user's categories
    const categoriesSnapshot = await db.collection('categories')
      .where('createdBy', '==', uid)
      .get()
    
    categoriesSnapshot.forEach(doc => {
      batch.delete(doc.ref)
      console.log(`  - Deleting category: ${doc.id}`)
    })
    
    // Delete user's task instances
    const tasksSnapshot = await db.collection('taskInstances')
      .where('assignedTo', '==', uid)
      .get()
    
    tasksSnapshot.forEach(doc => {
      batch.delete(doc.ref)
    })
    console.log(`  - Deleting ${tasksSnapshot.size} task instances`)
    
    // Update households to remove user from members
    const householdsSnapshot = await db.collection('households')
      .where('members', 'array-contains', uid)
      .get()
    
    householdsSnapshot.forEach(async (householdDoc) => {
      const household = householdDoc.data()
      const updatedMembers = (household.members || []).filter((memberId: string) => memberId !== uid)
      
      // If user was the owner, we need to handle that
      if (household.createdBy === uid) {
        console.log(`  ⚠️  Warning: User is owner of household ${householdDoc.id}`)
        console.log(`     You may want to transfer ownership or delete the household manually`)
      }
      
      batch.update(householdDoc.ref, {
        members: updatedMembers
      })
      console.log(`  - Removing user from household: ${householdDoc.id}`)
    })
    
    await batch.commit()
    console.log(`✅ User data deleted from Firestore`)
    return true
  } catch (error: any) {
    console.error(`❌ Error deleting user data from Firestore:`, error.message)
    return false
  }
}

async function promptConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y')
    })
  })
}

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('Usage: npx ts-node scripts/deleteUser.ts <user-email-or-uid> [--delete-firestore]')
    console.log('\nExamples:')
    console.log('  npx ts-node scripts/deleteUser.ts user@example.com')
    console.log('  npx ts-node scripts/deleteUser.ts abc123xyz --delete-firestore')
    process.exit(1)
  }

  const identifier = args[0]
  const deleteFirestore = args.includes('--delete-firestore')

  console.log(`\n🔍 Looking for user: ${identifier}\n`)

  const user = await findUserByIdentifier(identifier)
  
  if (!user) {
    console.error(`❌ User not found: ${identifier}`)
    process.exit(1)
  }

  console.log(`\n📋 User Information:`)
  console.log(`   UID: ${user.uid}`)
  console.log(`   Email: ${user.email || 'N/A'}`)
  console.log(`   Display Name: ${user.displayName || 'N/A'}`)
  console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`)
  console.log(`   Created: ${new Date(user.metadata.creationTime).toLocaleString()}`)
  console.log(`   Last Sign In: ${user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'Never'}`)

  const confirmed = await promptConfirmation(`\n⚠️  Are you sure you want to delete this user?`)
  
  if (!confirmed) {
    console.log('❌ Deletion cancelled')
    process.exit(0)
  }

  console.log(`\n🗑️  Deleting user...\n`)

  let authDeleted = false
  let firestoreDeleted = false

  // Delete from Firestore first (if requested)
  if (deleteFirestore) {
    firestoreDeleted = await deleteUserFromFirestore(user.uid)
  } else {
    console.log(`ℹ️  Skipping Firestore deletion (use --delete-firestore to delete user data)`)
  }

  // Delete from Authentication
  authDeleted = await deleteUserFromAuth(user.uid)

  console.log(`\n📊 Summary:`)
  console.log(`   Auth: ${authDeleted ? '✅ Deleted' : '❌ Failed'}`)
  console.log(`   Firestore: ${deleteFirestore ? (firestoreDeleted ? '✅ Deleted' : '❌ Failed') : '⏭️  Skipped'}`)

  if (authDeleted && (!deleteFirestore || firestoreDeleted)) {
    console.log(`\n✅ User deletion completed successfully!`)
    process.exit(0)
  } else {
    console.log(`\n⚠️  User deletion completed with errors`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

