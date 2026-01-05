import * as functions from 'firebase-functions'
import { GoogleGenerativeAI } from '@google/generative-ai'
import * as admin from 'firebase-admin'

admin.initializeApp()

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(functions.config().gemini?.api_key || process.env.GEMINI_API_KEY || '')

interface Routine {
  name: string
  frequency: string
  categoryId?: string
}

interface TaskSuggestion {
  name: string
  frequency: string
  category?: string
  reason: string
}

/**
 * Generate smart task suggestions based on household data
 */
export const generateTaskSuggestions = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  // Rate limiting: Max 10 requests per user per hour
  const userId = context.auth.uid
  const rateLimitKey = `suggestions:${userId}`
  const rateLimitRef = admin.firestore().collection('rateLimits').doc(rateLimitKey)
  const rateLimitDoc = await rateLimitRef.get()
  
  const now = Date.now()
  const oneHourAgo = now - 3600000
  
  if (rateLimitDoc.exists) {
    const data = rateLimitDoc.data()
    const lastRequest = data?.lastRequest || 0
    const count = data?.count || 0
    
    // Reset count if last request was more than an hour ago
    if (lastRequest < oneHourAgo) {
      await rateLimitRef.set({
        count: 1,
        lastRequest: now
      }, { merge: true })
    } else {
      // Check if limit exceeded
      if (count >= 10) {
        throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please try again later.')
      }
      // Increment count
      await rateLimitRef.set({
        count: count + 1,
        lastRequest: now
      }, { merge: true })
    }
  } else {
    // First request - create new document
    await rateLimitRef.set({
      count: 1,
      lastRequest: now
    })
  }

  const { routines, categories, tasks } = data

  if (!genAI) {
    throw new functions.https.HttpsError('failed-precondition', 'Gemini API not configured')
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    // Get existing routine names and categories
    const routineNames = routines.map((r: Routine) => r.name).join(', ')
    const categoryNames = categories.map((c: any) => c.name).join(', ')

    // Calculate some stats
    const completedTasks = tasks.filter((t: any) => t.isCompleted).length
    const totalTasks = tasks.length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const prompt = `You are a helpful AI assistant for a household routine management app.

Current household routines: ${routineNames || 'None yet'}
Existing categories: ${categoryNames || 'None yet'}
Task completion rate: ${completionRate}%

Based on this information, suggest 3-5 new household tasks/routines that would be useful. Consider:
1. Common household maintenance tasks (cleaning, organizing, maintenance)
2. Tasks that complement existing routines
3. Seasonal tasks if relevant
4. Tasks for different household areas (kitchen, bathroom, bedroom, living room, outdoor)
5. Tasks that are commonly missed or forgotten

For each suggestion, provide:
- Task name (short, clear, e.g., "Clean oven" or "Organize pantry")
- Suggested frequency (daily, weekly, biweekly, or monthly)
- Suggested category (based on existing categories or suggest a new one)
- Brief reason why this would be helpful

Return ONLY a JSON array in this exact format:
[
  {
    "name": "Task name",
    "frequency": "weekly",
    "category": "Kitchen",
    "reason": "Brief reason"
  }
]

Do not include any markdown formatting, code blocks, or extra text. Just the JSON array.`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Parse JSON from response (remove markdown code blocks if present)
    let jsonText = text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }

    const suggestions: TaskSuggestion[] = JSON.parse(jsonText)

    return { suggestions }
  } catch (error: any) {
    console.error('Error generating suggestions:', error)
    throw new functions.https.HttpsError('internal', 'Failed to generate suggestions', error.message)
  }
})

/**
 * Parse natural language input to create a routine
 */
export const parseTaskInput = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  // Rate limiting: Max 20 requests per user per hour
  const userId = context.auth.uid
  const rateLimitKey = `parse:${userId}`
  const rateLimitRef = admin.firestore().collection('rateLimits').doc(rateLimitKey)
  const rateLimitDoc = await rateLimitRef.get()
  
  const now = Date.now()
  const oneHourAgo = now - 3600000
  
  if (rateLimitDoc.exists) {
    const data = rateLimitDoc.data()
    const lastRequest = data?.lastRequest || 0
    const count = data?.count || 0
    
    // Reset count if last request was more than an hour ago
    if (lastRequest < oneHourAgo) {
      await rateLimitRef.set({
        count: 1,
        lastRequest: now
      }, { merge: true })
    } else {
      // Check if limit exceeded
      if (count >= 20) {
        throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please try again later.')
      }
      // Increment count
      await rateLimitRef.set({
        count: count + 1,
        lastRequest: now
      }, { merge: true })
    }
  } else {
    // First request - create new document
    await rateLimitRef.set({
      count: 1,
      lastRequest: now
    })
  }

  const { input, existingCategories } = data

  if (!genAI) {
    throw new functions.https.HttpsError('failed-precondition', 'Gemini API not configured')
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const categoryList = existingCategories.map((c: any) => c.name).join(', ')

    const prompt = `Parse this natural language task input into structured data: "${input}"

Existing categories: ${categoryList || 'None'}

Extract:
1. Task name (short, clear)
2. Frequency (daily, weekly, biweekly, or monthly)
3. Category (match existing category if possible, or suggest a new one)

Return ONLY a JSON object in this exact format:
{
  "name": "Task name",
  "frequency": "weekly",
  "category": "Category name"
}

Do not include any markdown formatting, code blocks, or extra text. Just the JSON object.`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Parse JSON from response
    let jsonText = text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }

    const parsed = JSON.parse(jsonText)

    return parsed
  } catch (error: any) {
    console.error('Error parsing task input:', error)
    throw new functions.https.HttpsError('internal', 'Failed to parse task input', error.message)
  }
})

/**
 * Generate smart insights based on task completion patterns
 */
export const generateInsights = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  // Rate limiting: Max 10 requests per user per hour (increased from 5)
  const userId = context.auth.uid
  const rateLimitKey = `insights:${userId}`
  const rateLimitRef = admin.firestore().collection('rateLimits').doc(rateLimitKey)
  const rateLimitDoc = await rateLimitRef.get()
  
  const now = Date.now()
  const oneHourAgo = now - 3600000
  
  if (rateLimitDoc.exists) {
    const data = rateLimitDoc.data()
    const lastRequest = data?.lastRequest || 0
    const count = data?.count || 0
    
    // Reset count if last request was more than an hour ago
    if (lastRequest < oneHourAgo) {
      await rateLimitRef.set({
        count: 1,
        lastRequest: now
      }, { merge: true })
    } else {
      // Check if limit exceeded
      if (count >= 10) {
        throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please try again later.')
      }
      // Increment count
      await rateLimitRef.set({
        count: count + 1,
        lastRequest: now
      }, { merge: true })
    }
  } else {
    // First request - create new document
    await rateLimitRef.set({
      count: 1,
      lastRequest: now
    })
  }

  const { tasks, routines, categories } = data

  if (!genAI) {
    throw new functions.https.HttpsError('failed-precondition', 'Gemini API not configured')
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    // Calculate some stats
    const completedTasks = tasks.filter((t: any) => t.isCompleted).length
    const totalTasks = tasks.length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Find most/least completed categories
    const categoryStats = categories.map((cat: any) => {
      const catTasks = tasks.filter((t: any) => {
        const routine = routines.find((r: any) => r.id === t.routineId)
        return routine?.categoryId === cat.id
      })
      const catCompleted = catTasks.filter((t: any) => t.isCompleted).length
      return {
        name: cat.name,
        total: catTasks.length,
        completed: catCompleted,
        rate: catTasks.length > 0 ? Math.round((catCompleted / catTasks.length) * 100) : 0
      }
    })

    const prompt = `Analyze this household task data and generate 1-2 helpful, personalized insights:

Total tasks: ${totalTasks}
Completed: ${completedTasks}
Completion rate: ${completionRate}%

Category performance:
${categoryStats.map((c: any) => `- ${c.name}: ${c.rate}% (${c.completed}/${c.total})`).join('\n')}

Generate 1-2 short, actionable insights (max 100 characters each) that would help the user improve their household management. Be positive and encouraging.

Return ONLY a JSON array of strings:
["Insight 1", "Insight 2"]

Do not include any markdown formatting, code blocks, or extra text. Just the JSON array.`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Parse JSON from response
    let jsonText = text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }

    const insights = JSON.parse(jsonText)

    return { insights }
  } catch (error: any) {
    console.error('Error generating insights:', error)
    throw new functions.https.HttpsError('internal', 'Failed to generate insights', error.message)
  }
})

/**
 * Scheduled function to send daily task reminders at 8 AM
 * Runs every day at 8:00 AM UTC (adjust timezone as needed)
 */
export const sendDailyTaskReminders = functions.pubsub
  .schedule('0 8 * * *') // 8 AM UTC every day (cron format)
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Running daily task reminders job...')
    
    try {
      const db = admin.firestore()
      const messaging = admin.messaging()
      
      // Get all users with notifications enabled
      const usersSnapshot = await db.collection('users')
        .where('notificationEnabled', '==', true)
        .get()
      
      if (usersSnapshot.empty) {
        console.log('No users with notifications enabled')
        return null
      }
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const todayStart = today.getTime()
      const todayEnd = tomorrow.getTime()
      
      let notificationsSent = 0
      let errors = 0
      
      // Process each user
      for (const userDoc of usersSnapshot.docs) {
        try {
          const userData = userDoc.data()
          const userId = userDoc.id
          const fcmToken = userData.fcmToken
          
          if (!fcmToken) {
            console.log(`User ${userId} has no FCM token, skipping`)
            continue
          }
          
          // Get tasks due today assigned to this user
          const tasksSnapshot = await db.collection('taskInstances')
            .where('householdId', '==', userData.householdId)
            .where('assignedTo', '==', userId)
            .where('dueDate', '>=', todayStart)
            .where('dueDate', '<', todayEnd)
            .get()
          
          // Filter to only incomplete tasks
          const incompleteTasks = tasksSnapshot.docs.filter(
            doc => !doc.data().isCompleted
          )
          
          if (incompleteTasks.length === 0) {
            console.log(`User ${userId} has no incomplete tasks today, skipping`)
            continue
          }
          
          // Prepare notification
          const taskCount = incompleteTasks.length
          const title = taskCount === 1 
            ? '1 task due today! 📋'
            : `${taskCount} tasks due today! 📋`
          
          const body = taskCount === 1
            ? 'You have 1 task to complete today. Check it out!'
            : `You have ${taskCount} tasks to complete today. Let's get started!`
          
          // Send FCM notification
          const message = {
            notification: {
              title,
              body
            },
            data: {
              type: 'daily-reminder',
              url: 'https://household-chores-d8eae.web.app' // Your app URL
            },
            token: fcmToken,
            webpush: {
              notification: {
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                tag: 'daily-tasks-reminder'
              }
            }
          }
          
          await messaging.send(message)
          notificationsSent++
          console.log(`Sent notification to user ${userId} (${taskCount} tasks)`)
          
        } catch (error: any) {
          errors++
          console.error(`Error sending notification to user ${userDoc.id}:`, error)
          
          // If token is invalid, disable notifications for this user
          if (error.code === 'messaging/invalid-registration-token' || 
              error.code === 'messaging/registration-token-not-registered') {
            await userDoc.ref.update({
              notificationEnabled: false,
              fcmToken: admin.firestore.FieldValue.delete()
            })
            console.log(`Disabled notifications for user ${userDoc.id} (invalid token)`)
          }
        }
      }
      
      console.log(`Daily reminders job completed. Sent: ${notificationsSent}, Errors: ${errors}`)
      return null
      
    } catch (error: any) {
      console.error('Error in daily task reminders job:', error)
      throw error
    }
  })

/**
 * Test function to send a push notification to a specific user
 * Useful for testing notifications locally
 */
export const testPushNotification = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  const userId = context.auth.uid
  const { taskCount = 1 } = data

  try {
    const db = admin.firestore()
    const messaging = admin.messaging()

    // Get user's FCM token
    const userDoc = await db.collection('users').doc(userId).get()
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found')
    }

    const userData = userDoc.data()
    const fcmToken = userData?.fcmToken

    if (!fcmToken) {
      throw new functions.https.HttpsError('failed-precondition', 'User has no FCM token. Please enable notifications first.')
    }

    // Prepare test notification
    const title = taskCount === 1 
      ? '🧪 Test: 1 task due today! 📋'
      : `🧪 Test: ${taskCount} tasks due today! 📋`
    
    const body = taskCount === 1
      ? 'This is a test notification. You have 1 task to complete today.'
      : `This is a test notification. You have ${taskCount} tasks to complete today.`

    // Send FCM notification
    const message = {
      notification: {
        title,
        body
      },
      data: {
        type: 'test-notification',
        url: 'https://household-chores-d8eae.web.app'
      },
      token: fcmToken,
      webpush: {
        notification: {
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'test-notification'
        }
      }
    }

    await messaging.send(message)
    
    return { 
      success: true, 
      message: 'Test notification sent successfully!',
      taskCount 
    }
  } catch (error: any) {
    console.error('Error sending test notification:', error)
    
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      // Update user to remove invalid token
      await admin.firestore().collection('users').doc(userId).update({
        notificationEnabled: false,
        fcmToken: admin.firestore.FieldValue.delete()
      })
      throw new functions.https.HttpsError('invalid-argument', 'Invalid FCM token. Please re-enable notifications.')
    }
    
    throw new functions.https.HttpsError('internal', `Failed to send test notification: ${error.message}`)
  }
})

