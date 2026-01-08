/**
 * Test script to create an overdue daily routine for testing the checkMissedTasks Cloud Function
 * 
 * This script uses Firebase Admin SDK via environment variables (no serviceAccountKey.json needed)
 * 
 * Usage:
 * 1. Set Firebase credentials as environment variables:
 *    export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
 *    OR use: firebase use your-project-id
 * 
 * 2. Run: node scripts/createTestOverdueRoutine.js
 * 
 * This will:
 * - Create a test routine "Test Daily Routine (Overdue)"
 * - Create a task instance that's already overdue (yesterday)
 * - Assign it to user: kk1Pl9DSnjS5aA954MqMeOKVW9W2
 */

import admin from 'firebase-admin'

// Initialize Firebase Admin
// Try multiple methods to get credentials
if (!admin.apps.length) {
  try {
    // Method 1: Try application default credentials (from firebase use or GOOGLE_APPLICATION_CREDENTIALS)
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    })
    console.log('✓ Using application default credentials')
  } catch (error1) {
    try {
      // Method 2: Try serviceAccountKey.json if it exists
      const serviceAccount = await import('../serviceAccountKey.json', { assert: { type: 'json' } })
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount.default)
      })
      console.log('✓ Using serviceAccountKey.json')
    } catch (error2) {
      console.error('❌ Error initializing Firebase Admin:', error1.message)
      console.error('\nPlease use one of these methods:')
      console.error('\n1. Use Firebase CLI (recommended):')
      console.error('   firebase login')
      console.error('   firebase use your-project-id')
      console.error('   Then run this script again')
      console.error('\n2. Download serviceAccountKey.json:')
      console.error('   - Go to Firebase Console → Project Settings → Service Accounts')
      console.error('   - Click "Generate new private key"')
      console.error('   - Save as serviceAccountKey.json in project root')
      console.error('\n3. Set environment variable:')
      console.error('   export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccountKey.json"')
      process.exit(1)
    }
  }
}

const db = admin.firestore()

const TEST_USER_ID = 'kk1Pl9DSnjS5aA954MqMeOKVW9W2'

async function createTestOverdueRoutine() {
  try {
    console.log('Creating test overdue routine...')
    console.log(`For user: ${TEST_USER_ID}`)
    
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
    
    console.log(`✓ Found user's household: ${householdId}`)
    
    // Create a test category if it doesn't exist
    let categoryId
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
      console.log(`✓ Created test category: ${categoryId}`)
    } else {
      categoryId = categoryQuery.docs[0].id
      console.log(`✓ Using existing test category: ${categoryId}`)
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
    console.log(`✓ Created test routine: ${routineId}`)
    
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
    
    console.log(`✓ Created overdue task instance: ${taskRef.id}`)
    console.log(`✓ Due date: ${yesterday.toISOString()} (yesterday)`)
    
    console.log('\n✅ Test setup complete!')
    console.log(`\n📋 Next steps to test the Cloud Function:`)
    console.log(`\n1. Deploy the function:`)
    console.log(`   cd functions && npm run build && cd ..`)
    console.log(`   firebase deploy --only functions:checkMissedTasks`)
    console.log(`\n2. Trigger it manually:`)
    console.log(`   firebase functions:shell`)
    console.log(`   Then run: checkMissedTasks()`)
    console.log(`\n3. Or wait for it to run automatically at 2 AM UTC`)
    console.log(`\n📊 Expected result:`)
    console.log(`   - The overdue task should be marked as completed`)
    console.log(`   - A new task for today should be created`)
    console.log(`   - The missed count should increment to 1`)
    console.log(`\n🔍 Check results in Firestore:`)
    console.log(`   - Task ${taskRef.id} should have isCompleted: true`)
    console.log(`   - A new task should exist with dueDate: today`)
    console.log(`   - The new task should have missedCount: 1`)
    
    return {
      routineId,
      taskId: taskRef.id,
      categoryId,
      householdId,
      dueDate: yesterdayTimestamp
    }
    
  } catch (error) {
    console.error('\n❌ Error creating test routine:', error.message)
    console.error('\nTroubleshooting:')
    console.error('1. Make sure you\'re logged in: firebase login')
    console.error('2. Set your project: firebase use your-project-id')
    console.error('3. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable')
    throw error
  }
}

// Run the script
createTestOverdueRoutine()
  .then((result) => {
    console.log('\n✅ Success! Created:', result)
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })
