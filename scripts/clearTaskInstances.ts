/**
 * Script to delete all taskInstances from Firestore
 * 
 * Usage:
 * 1. Make sure you have Firebase CLI installed: npm install -g firebase-tools
 * 2. Make sure you're logged in: firebase login
 * 3. Run: npx ts-node scripts/clearTaskInstances.ts
 * 
 * WARNING: This will delete ALL task instances. Use with caution!
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as admin from 'firebase-admin'
import * as readline from 'readline'

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json') // You'll need to download this from Firebase Console

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = getFirestore()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function clearTaskInstances() {
  try {
    console.log('⚠️  WARNING: This will delete ALL task instances from Firestore!')
    console.log('This action cannot be undone.\n')
    
    const answer = await question('Are you sure you want to continue? Type "DELETE ALL" to confirm: ')
    
    if (answer !== 'DELETE ALL') {
      console.log('Operation cancelled.')
      rl.close()
      return
    }

    console.log('\nFetching all task instances...')
    const taskInstancesRef = db.collection('taskInstances')
    const snapshot = await taskInstancesRef.get()
    
    if (snapshot.empty) {
      console.log('No task instances found.')
      rl.close()
      return
    }

    console.log(`Found ${snapshot.size} task instances.`)
    const confirm = await question(`Delete all ${snapshot.size} task instances? (yes/no): `)
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('Operation cancelled.')
      rl.close()
      return
    }

    console.log('\nDeleting task instances...')
    const batch = db.batch()
    let count = 0
    const BATCH_SIZE = 500 // Firestore batch limit

    snapshot.docs.forEach((doc, index) => {
      batch.delete(doc.ref)
      count++

      // Firestore batches are limited to 500 operations
      if (count === BATCH_SIZE) {
        batch.commit()
        count = 0
      }
    })

    // Commit remaining deletions
    if (count > 0) {
      await batch.commit()
    }

    console.log(`✅ Successfully deleted ${snapshot.size} task instances!`)
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    rl.close()
  }
}

clearTaskInstances()

