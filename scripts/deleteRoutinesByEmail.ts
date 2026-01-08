/**
 * Script to delete all routines for a specific user by email address
 * 
 * Usage:
 *   npx tsx scripts/deleteRoutinesByEmail.ts <user-email> [--delete-tasks]
 * 
 * Examples:
 *   npx tsx scripts/deleteRoutinesByEmail.ts abidul.rmdn@gmail.com
 *   npx tsx scripts/deleteRoutinesByEmail.ts abidul.rmdn@gmail.com --delete-tasks
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

async function findUserByEmail(email: string): Promise<admin.auth.UserRecord | null> {
  try {
    const user = await auth.getUserByEmail(email)
    return user
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return null
    }
    throw error
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

async function deleteRoutinesForUser(uid: string, deleteTasks: boolean = false): Promise<void> {
  try {
    // Find all routines created by this user
    const routinesSnapshot = await db.collection('routines')
      .where('createdBy', '==', uid)
      .get()

    if (routinesSnapshot.empty) {
      console.log('✅ No routines found for this user.')
      return
    }

    const routineIds: string[] = []
    const routineNames: string[] = []

    routinesSnapshot.forEach(doc => {
      routineIds.push(doc.id)
      const data = doc.data()
      routineNames.push(data.name || doc.id)
    })

    console.log(`\n📋 Found ${routineIds.length} routine(s) created by this user:`)
    routineNames.forEach((name, index) => {
      console.log(`   ${index + 1}. ${name} (ID: ${routineIds[index]})`)
    })

    // If deleteTasks is true, find and count associated task instances
    let taskCount = 0
    if (deleteTasks) {
      for (const routineId of routineIds) {
        const tasksSnapshot = await db.collection('taskInstances')
          .where('routineId', '==', routineId)
          .get()
        taskCount += tasksSnapshot.size
      }
      if (taskCount > 0) {
        console.log(`\n⚠️  This will also delete ${taskCount} associated task instance(s).`)
      }
    }

    const confirmed = await promptConfirmation(`\n⚠️  Are you sure you want to delete ${routineIds.length} routine(s)?`)
    
    if (!confirmed) {
      console.log('❌ Deletion cancelled')
      return
    }

    console.log('\n🗑️  Deleting routines...\n')

    // Delete routines in batches (Firestore batch limit is 500)
    const batch = db.batch()
    let batchCount = 0
    let deletedRoutines = 0

    for (const routineId of routineIds) {
      const routineRef = db.collection('routines').doc(routineId)
      batch.delete(routineRef)
      batchCount++
      deletedRoutines++

      // Commit batch if we reach 500 operations
      if (batchCount === 500) {
        await batch.commit()
        console.log(`  ✅ Deleted batch of routines...`)
        batchCount = 0
      }
    }

    // Commit remaining deletions
    if (batchCount > 0) {
      await batch.commit()
    }

    console.log(`✅ Deleted ${deletedRoutines} routine(s)`)

    // Delete associated task instances if requested
    if (deleteTasks && taskCount > 0) {
      console.log('\n🗑️  Deleting associated task instances...\n')
      
      const taskBatch = db.batch()
      let taskBatchCount = 0
      let deletedTasks = 0

      for (const routineId of routineIds) {
        const tasksSnapshot = await db.collection('taskInstances')
          .where('routineId', '==', routineId)
          .get()

        tasksSnapshot.forEach(taskDoc => {
          taskBatch.delete(taskDoc.ref)
          taskBatchCount++
          deletedTasks++

          // Commit batch if we reach 500 operations
          if (taskBatchCount === 500) {
            taskBatch.commit()
            console.log(`  ✅ Deleted batch of tasks...`)
            taskBatchCount = 0
          }
        })
      }

      // Commit remaining task deletions
      if (taskBatchCount > 0) {
        await taskBatch.commit()
      }

      console.log(`✅ Deleted ${deletedTasks} task instance(s)`)
    }

    console.log('\n✅ All done!')
    
  } catch (error: any) {
    console.error('❌ Error deleting routines:', error.message)
    console.error(error.stack)
    throw error
  }
}

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('Usage: npx tsx scripts/deleteRoutinesByEmail.ts <user-email> [--delete-tasks]')
    console.log('\nExamples:')
    console.log('  npx tsx scripts/deleteRoutinesByEmail.ts abidul.rmdn@gmail.com')
    console.log('  npx tsx scripts/deleteRoutinesByEmail.ts abidul.rmdn@gmail.com --delete-tasks')
    process.exit(1)
  }

  const email = args[0]
  const deleteTasks = args.includes('--delete-tasks')

  console.log(`\n🔍 Looking for user: ${email}\n`)

  const user = await findUserByEmail(email)
  
  if (!user) {
    console.error(`❌ User not found: ${email}`)
    process.exit(1)
  }

  console.log(`\n📋 User Information:`)
  console.log(`   UID: ${user.uid}`)
  console.log(`   Email: ${user.email || 'N/A'}`)
  console.log(`   Display Name: ${user.displayName || 'N/A'}`)

  await deleteRoutinesForUser(user.uid, deleteTasks)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

