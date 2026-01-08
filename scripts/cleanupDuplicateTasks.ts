/**
 * Script to clean up duplicate task instances in Firestore
 * 
 * This script finds and removes duplicate task instances that have:
 * - Same routineId
 * - Same assignedTo
 * - Same dueDate
 * 
 * It keeps the oldest one (by createdAt) and deletes the rest.
 * 
 * Usage:
 * 1. Make sure you have Firebase CLI installed: npm install -g firebase-tools
 * 2. Login: firebase login
 * 3. Set your project: firebase use your-project-id
 * 4. Run: npx ts-node scripts/cleanupDuplicateTasks.ts
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as admin from 'firebase-admin'
import * as serviceAccount from '../serviceAccountKey.json' // You'll need to download this from Firebase Console

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: cert(serviceAccount as admin.ServiceAccount)
  })
}

const db = getFirestore()

interface TaskInstance {
  id: string
  routineId: string
  assignedTo: string
  dueDate: number
  createdAt: number
  isCompleted: boolean
}

async function cleanupDuplicateTasks() {
  console.log('Starting duplicate task cleanup...')
  
  try {
    // Get all task instances
    const tasksSnapshot = await db.collection('taskInstances').get()
    const tasks: TaskInstance[] = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TaskInstance))
    
    console.log(`Found ${tasks.length} total task instances`)
    
    // Group tasks by routineId + assignedTo + dueDate
    const taskGroups = new Map<string, TaskInstance[]>()
    
    for (const task of tasks) {
      const key = `${task.routineId}_${task.assignedTo}_${task.dueDate}`
      if (!taskGroups.has(key)) {
        taskGroups.set(key, [])
      }
      taskGroups.get(key)!.push(task)
    }
    
    // Find duplicates (groups with more than 1 task)
    const duplicates: TaskInstance[][] = []
    for (const [key, group] of taskGroups.entries()) {
      if (group.length > 1) {
        duplicates.push(group)
      }
    }
    
    console.log(`Found ${duplicates.length} groups with duplicates`)
    
    let totalDeleted = 0
    const batch = db.batch()
    let batchCount = 0
    const MAX_BATCH_SIZE = 500
    
    // For each duplicate group, keep the oldest one, delete the rest
    for (const group of duplicates) {
      // Sort by createdAt (oldest first)
      group.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      
      // Keep the first one (oldest), delete the rest
      const toKeep = group[0]
      const toDelete = group.slice(1)
      
      console.log(`Group: routineId=${toKeep.routineId}, assignedTo=${toKeep.assignedTo}, dueDate=${new Date(toKeep.dueDate).toISOString()}`)
      console.log(`  Keeping: ${toKeep.id} (created: ${new Date(toKeep.createdAt).toISOString()})`)
      
      for (const task of toDelete) {
        console.log(`  Deleting: ${task.id} (created: ${new Date(task.createdAt).toISOString()})`)
        const taskRef = db.collection('taskInstances').doc(task.id)
        batch.delete(taskRef)
        batchCount++
        totalDeleted++
        
        // Firestore batch limit is 500 operations
        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit()
          console.log(`Committed batch of ${batchCount} deletions`)
          batchCount = 0
        }
      }
    }
    
    // Commit remaining deletions
    if (batchCount > 0) {
      await batch.commit()
      console.log(`Committed final batch of ${batchCount} deletions`)
    }
    
    console.log(`\n✅ Cleanup complete!`)
    console.log(`   Total duplicates found: ${duplicates.length} groups`)
    console.log(`   Total tasks deleted: ${totalDeleted}`)
    console.log(`   Tasks remaining: ${tasks.length - totalDeleted}`)
    
  } catch (error) {
    console.error('Error cleaning up duplicates:', error)
    throw error
  }
}

// Run the cleanup
cleanupDuplicateTasks()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })

