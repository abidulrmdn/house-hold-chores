/**
 * Test script to create an overdue daily routine for testing the checkMissedTasks Cloud Function
 * 
 * Usage:
 * 1. Make sure you have Firebase Admin SDK configured
 * 2. Set your Firebase project: firebase use your-project-id
 * 3. Run: npx ts-node scripts/createTestOverdueRoutine.ts
 * 
 * This will:
 * - Create a test routine "Test Daily Routine"
 * - Create a task instance that's already overdue (yesterday)
 * - Assign it to the specified user
 * - Then you can test the checkMissedTasks Cloud Function
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as admin from 'firebase-admin'
import * as serviceAccount from '../serviceAccountKey.json' // Download from Firebase Console

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: cert(serviceAccount as admin.ServiceAccount)
  })
}

const db = getFirestore()

const TEST_USER_ID = 'kk1Pl9DSnjS5aA954MqMeOKVW9W2'

async function createTestOverdueRoutine() {
  try {
    console.log('Creating test overdue routine...')
    
    // Get user's household ID
    const userDoc = await db.collection('users').doc(TEST_USER_ID).get()
    if (!userDoc.exists) {
      throw new Error(`User ${TEST_USER_ID} not found`)
    }
    
    const userData = userDoc.data()
    const householdId = userData?.householdId
    
    if (!householdId) {
      throw new Error(`User ${TEST_USER_ID} has no householdId`)
    }
    
    console.log(`Found user's household: ${householdId}`)
    
    // Create a test category if it doesn't exist
    let categoryId: string
    const categoryQuery = await db.collection('categories')
      .where('householdId', '==', householdId)
      .where('name', '==', 'Test Category')
      .limit(1)
      .get()
    
    if (categoryQuery.empty) {
      const categoryRef = await db.collection('categories').add({
        name: 'Test Category',
        color: '#ff0000',
        householdId: householdId,
        createdAt: Date.now()
      })
      categoryId = categoryRef.id
      console.log(`Created test category: ${categoryId}`)
    } else {
      categoryId = categoryQuery.docs[0].id
      console.log(`Using existing test category: ${categoryId}`)
    }
    
    // Create a test routine
    const routineRef = await db.collection('routines').add({
      name: 'Test Daily Routine (Overdue)',
      categoryId: categoryId,
      frequency: 'daily',
      assignedTo: [TEST_USER_ID],
      householdId: householdId,
      createdBy: TEST_USER_ID,
      isActive: true,
      createdAt: Date.now()
    })
    
    const routineId = routineRef.id
    console.log(`Created test routine: ${routineId}`)
    
    // Create an overdue task instance (yesterday)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    const yesterdayTimestamp = yesterday.getTime()
    
    const taskRef = await db.collection('taskInstances').add({
      routineId: routineId,
      dueDate: yesterdayTimestamp,
      assignedTo: TEST_USER_ID,
      isCompleted: false,
      missedCount: 0,
      householdId: householdId,
      createdAt: Date.now()
    })
    
    console.log(`Created overdue task instance: ${taskRef.id}`)
    console.log(`Due date: ${yesterday.toISOString()} (yesterday)`)
    
    console.log('\n✅ Test setup complete!')
    console.log(`\nTo test the Cloud Function:`)
    console.log(`1. Deploy the function: firebase deploy --only functions:checkMissedTasks`)
    console.log(`2. Trigger it manually: firebase functions:shell`)
    console.log(`   Then run: checkMissedTasks()`)
    console.log(`3. Or wait for it to run automatically at 2 AM UTC`)
    console.log(`\nExpected result:`)
    console.log(`- The overdue task should be marked as completed`)
    console.log(`- A new task for today should be created`)
    console.log(`- The missed count should increment to 1`)
    
    return {
      routineId,
      taskId: taskRef.id,
      categoryId,
      householdId
    }
    
  } catch (error: any) {
    console.error('Error creating test routine:', error)
    throw error
  }
}

// Run the script
createTestOverdueRoutine()
  .then((result) => {
    console.log('\n✅ Success!', result)
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })

