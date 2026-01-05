/**
 * Script to delete all routine-related data from Firestore
 * 
 * This script will delete:
 * - All taskInstances
 * - All routines
 * - Optionally: All categories
 * 
 * Usage:
 * 1. Make sure you have Firebase CLI installed: npm install -g firebase-tools
 * 2. Make sure you're logged in: firebase login
 * 3. Install dependencies: npm install firebase-admin
 * 4. Download serviceAccountKey.json from Firebase Console → Project Settings → Service Accounts
 * 5. Run: npx ts-node scripts/clearAllRoutineData.ts
 * 
 * WARNING: This will delete ALL routine data. Use with caution!
 */

import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as admin from 'firebase-admin'
import * as readline from 'readline'

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  // Try to use application default credentials (for Firebase CLI)
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    })
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin.')
    console.error('Please make sure you are logged in: firebase login')
    console.error('Or provide serviceAccountKey.json in the project root')
    process.exit(1)
  }
}

const db = getFirestore()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function deleteCollection(collectionName: string): Promise<number> {
  const collectionRef = db.collection(collectionName)
  const snapshot = await collectionRef.get()
  
  if (snapshot.empty) {
    return 0
  }

  const batch = db.batch()
  let count = 0
  let deleted = 0

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
    count++
    deleted++

    // Firestore batches are limited to 500 operations
    if (count === 500) {
      batch.commit()
      count = 0
    }
  })

  // Commit remaining deletions
  if (count > 0) {
    await batch.commit()
  }

  return deleted
}

async function clearAllRoutineData() {
  try {
    console.log('⚠️  WARNING: This will delete ALL routine-related data from Firestore!')
    console.log('This includes:')
    console.log('  - All task instances')
    console.log('  - All routines')
    console.log('  - Optionally: All categories')
    console.log('\nThis action cannot be undone.\n')
    
    const answer = await question('Are you sure you want to continue? Type "DELETE ALL" to confirm: ')
    
    if (answer !== 'DELETE ALL') {
      console.log('Operation cancelled.')
      rl.close()
      return
    }

    // Count documents first
    console.log('\n📊 Counting documents...')
    const [taskInstancesSnapshot, routinesSnapshot, categoriesSnapshot] = await Promise.all([
      db.collection('taskInstances').get(),
      db.collection('routines').get(),
      db.collection('categories').get()
    ])

    const taskCount = taskInstancesSnapshot.size
    const routineCount = routinesSnapshot.size
    const categoryCount = categoriesSnapshot.size

    console.log(`Found:`)
    console.log(`  - ${taskCount} task instances`)
    console.log(`  - ${routineCount} routines`)
    console.log(`  - ${categoryCount} categories`)

    if (taskCount === 0 && routineCount === 0 && categoryCount === 0) {
      console.log('\n✅ No data to delete.')
      rl.close()
      return
    }

    const deleteCategories = await question('\nDelete categories too? (yes/no, default: no): ')
    const shouldDeleteCategories = deleteCategories.toLowerCase() === 'yes'

    console.log('\n🗑️  Deleting data...')

    // Delete task instances
    if (taskCount > 0) {
      console.log(`Deleting ${taskCount} task instances...`)
      const deleted = await deleteCollection('taskInstances')
      console.log(`✅ Deleted ${deleted} task instances`)
    }

    // Delete routines
    if (routineCount > 0) {
      console.log(`Deleting ${routineCount} routines...`)
      const deleted = await deleteCollection('routines')
      console.log(`✅ Deleted ${deleted} routines`)
    }

    // Delete categories (optional)
    if (shouldDeleteCategories && categoryCount > 0) {
      console.log(`Deleting ${categoryCount} categories...`)
      const deleted = await deleteCollection('categories')
      console.log(`✅ Deleted ${deleted} categories`)
    }

    console.log('\n✅ All done! Your Firestore is now clean.')
    console.log('Note: Households and Users are preserved.')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  } finally {
    rl.close()
  }
}

clearAllRoutineData()

