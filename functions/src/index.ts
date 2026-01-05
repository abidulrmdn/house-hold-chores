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

  // Rate limiting: Max 20 requests per user per hour (increased for onboarding wizard)
  const userId = context.auth.uid
  const rateLimitKey = `suggestions:${userId}`
  const rateLimitRef = admin.firestore().collection('rateLimits').doc(rateLimitKey)
  const rateLimitDoc = await rateLimitRef.get()
  
  const now = Date.now()
  const oneHourAgo = now - 3600000
  const RATE_LIMIT = 20 // Increased from 10 to 20 for better onboarding experience
  
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
      if (count >= RATE_LIMIT) {
        throw new functions.https.HttpsError('resource-exhausted', `Rate limit exceeded (${RATE_LIMIT} requests/hour). Please try again later.`)
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

  const { routines, categories, tasks, language = 'en', selectedAreas = [] } = data

  // Log incoming data for debugging
  console.log('=== generateTaskSuggestions called ===')
  console.log('Input data:', {
    routinesCount: routines?.length || 0,
    categoriesCount: categories?.length || 0,
    tasksCount: tasks?.length || 0,
    language,
    selectedAreasCount: selectedAreas?.length || 0,
    selectedAreas: selectedAreas || []
  })

  // Check if Gemini API is configured
  const apiKey = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === '') {
    console.error('Gemini API key not configured')
    throw new functions.https.HttpsError('failed-precondition', 'Gemini API not configured')
  }

  if (!genAI) {
    console.error('genAI not initialized')
    throw new functions.https.HttpsError('failed-precondition', 'Gemini API not initialized')
  }

  try {
    // Use gemini-pro model (most compatible)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    // Get existing routine names and categories
    const routineNames = routines.map((r: Routine) => r.name).join(', ')
    const categoryNames = categories.map((c: any) => c.name).join(', ')

    // Calculate some stats
    const completedTasks = tasks.filter((t: any) => t.isCompleted).length
    const totalTasks = tasks.length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Map area IDs to readable names
    const areaNameMap: Record<string, string> = {
      'kitchen': 'kitchen',
      'bathroom': 'bathroom',
      'bedroom': 'bedroom',
      'living-room': 'living room',
      'laundry': 'laundry room',
      'garage': 'garage',
      'outdoor': 'outdoor'
    }
    const selectedAreaNames = selectedAreas.map((id: string) => areaNameMap[id] || id).join(', ')

    // Language instruction
    const languageInstruction = language === 'ar' 
      ? 'IMPORTANT: Respond in Arabic. All task names, categories, and reasons must be in Arabic.'
      : language === 'nl'
      ? 'IMPORTANT: Respond in Dutch. All task names, categories, and reasons must be in Dutch.'
      : 'IMPORTANT: Respond in English. All task names, categories, and reasons must be in English.'

    const areasContext = selectedAreas.length > 0 
      ? `The user has selected these household areas: ${selectedAreaNames}. Focus your suggestions on tasks for these specific areas.`
      : 'Consider tasks for different household areas (kitchen, bathroom, bedroom, living room, outdoor, garage, laundry).'

    const prompt = `You are a helpful AI assistant for a household routine management app.

${languageInstruction}

Current household routines: ${routineNames || 'None yet'}
Existing categories: ${categoryNames || 'None yet'}
Task completion rate: ${completionRate}%
${areasContext}

Based on this information, suggest 8-20 new household tasks/routines that would be useful. Consider:
1. Common household maintenance tasks (cleaning, organizing, maintenance)
2. Tasks that complement existing routines
3. Seasonal tasks if relevant
4. ${selectedAreas.length > 0 ? `Tasks specifically for the selected areas: ${selectedAreaNames}` : 'Tasks for different household areas (kitchen, bathroom, bedroom, living room, outdoor, garage, laundry)'}
5. Tasks that are commonly missed or forgotten
6. Deep cleaning tasks that are done less frequently
7. Organizational tasks
8. Preventive maintenance tasks

For each suggestion, provide:
- Task name (short, clear, e.g., "Clean oven" or "Organize pantry")
- Suggested frequency (daily, weekly, biweekly, monthly, quarterly, or annually)
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

    let result, response, text
    try {
      result = await model.generateContent(prompt)
      response = result.response
      text = response.text()
    } catch (apiError: any) {
      console.error('Gemini API error:', apiError.message)
      // If model not found, try alternative
      if (apiError.message?.includes('not found') || apiError.message?.includes('404')) {
        console.log('Trying alternative model: gemini-1.5-pro')
        try {
          const altModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
          result = await altModel.generateContent(prompt)
          response = result.response
          text = response.text()
        } catch (altError: any) {
          console.error('Alternative model also failed:', altError.message)
          throw new functions.https.HttpsError('failed-precondition', `Gemini API error: ${apiError.message}. Please check your API key and model availability.`)
        }
      } else {
        throw apiError
      }
    }

    // Check if response is empty
    if (!text || text.trim().length === 0) {
      console.error('AI returned empty response')
      console.error('Response object:', JSON.stringify(response, null, 2))
      return { suggestions: [] }
    }

    // Log the raw response for debugging
    console.log('Raw AI response length:', text.length)
    console.log('Raw AI response (first 1000 chars):', text.substring(0, 1000))

    // Parse JSON from response (remove markdown code blocks if present)
    let jsonText = text.trim()
    
    // Remove markdown code blocks
    if (jsonText.includes('```json')) {
      const jsonBlockMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonBlockMatch) {
        jsonText = jsonBlockMatch[1].trim()
      } else {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      }
    } else if (jsonText.includes('```')) {
      const codeBlockMatch = jsonText.match(/```\s*([\s\S]*?)\s*```/)
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim()
      } else {
        jsonText = jsonText.replace(/```\n?/g, '')
      }
    }

    // Try to extract JSON array from the response
    // Sometimes AI includes extra text before/after JSON
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    } else {
      // If no array found, try to find any JSON structure
      const anyJsonMatch = jsonText.match(/\{[\s\S]*\}/)
      if (anyJsonMatch) {
        console.warn('Found JSON object instead of array, wrapping in array')
        jsonText = `[${anyJsonMatch[0]}]`
      }
    }

    console.log('Extracted JSON text:', jsonText.substring(0, 500)) // Log first 500 chars

    let suggestions: TaskSuggestion[]
    try {
      suggestions = JSON.parse(jsonText)
    } catch (parseError: any) {
      console.error('Failed to parse AI response:', parseError.message)
      console.error('Full response text length:', text.length)
      console.error('Full response text:', text)
      console.error('Cleaned JSON text length:', jsonText.length)
      console.error('Cleaned JSON text:', jsonText)
      
      // Try to fix common JSON issues
      try {
        // Try removing trailing commas
        const fixedJson = jsonText.replace(/,(\s*[}\]])/g, '$1')
        suggestions = JSON.parse(fixedJson)
        console.log('Successfully parsed after fixing trailing commas')
      } catch (secondTry: any) {
        console.error('Second parse attempt also failed:', secondTry.message)
        // Return empty array instead of throwing error - fallback will handle it
        console.warn('Returning empty suggestions array due to parse error')
        return { suggestions: [] }
      }
    }

    // Validate suggestions format
    if (!Array.isArray(suggestions)) {
      console.error('AI response is not an array:', typeof suggestions)
      console.error('Response value:', suggestions)
      console.error('Response text:', text)
      // Try to wrap in array if it's an object
      if (typeof suggestions === 'object' && suggestions !== null) {
        console.log('Wrapping object in array')
        suggestions = [suggestions]
      } else {
        // Return empty array instead of throwing error
        return { suggestions: [] }
      }
    }

    // Validate and filter suggestions
    const validSuggestions = suggestions
      .filter((s: any) => {
        const isValid = s && s.name && typeof s.name === 'string'
        if (!isValid) {
          console.warn('Filtered out invalid suggestion:', s)
        }
        return isValid
      })
      .map((s: any) => ({
        name: s.name.trim(),
        frequency: s.frequency || 'weekly',
        category: s.category || 'General',
        reason: s.reason || 'Useful household task'
      }))
      .slice(0, 20) // Limit to 20 suggestions max

    console.log(`Successfully parsed ${validSuggestions.length} valid suggestions from ${suggestions.length} total`)
    
    if (validSuggestions.length === 0) {
      console.warn('No valid suggestions after filtering. Original suggestions:', suggestions)
    }

    return { suggestions: validSuggestions }
  } catch (error: any) {
    console.error('Error generating suggestions:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    
    // Return empty array instead of throwing error - frontend will use fallback
    return { suggestions: [] }
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

  const { input, existingCategories, language = 'en' } = data

  if (!genAI) {
    throw new functions.https.HttpsError('failed-precondition', 'Gemini API not configured')
  }

  try {
    // Use gemini-pro model (most compatible)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    // Language instruction
    const languageInstruction = language === 'ar' 
      ? 'IMPORTANT: Respond in Arabic. All task names and categories must be in Arabic.'
      : language === 'nl'
      ? 'IMPORTANT: Respond in Dutch. All task names and categories must be in Dutch.'
      : 'IMPORTANT: Respond in English. All task names and categories must be in English.'

    const categoryList = existingCategories.map((c: any) => c.name).join(', ')

    const prompt = `Parse this natural language task input into structured data: "${input}"

${languageInstruction}

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

    let result, response, text
    try {
      result = await model.generateContent(prompt)
      response = result.response
      text = response.text()
    } catch (apiError: any) {
      console.error('Gemini API error:', apiError.message)
      // If model not found, try alternative
      if (apiError.message?.includes('not found') || apiError.message?.includes('404')) {
        console.log('Trying alternative model: gemini-1.5-pro')
        try {
          const altModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
          result = await altModel.generateContent(prompt)
          response = result.response
          text = response.text()
        } catch (altError: any) {
          console.error('Alternative model also failed:', altError.message)
          throw new functions.https.HttpsError('failed-precondition', `Gemini API error: ${apiError.message}. Please check your API key and model availability.`)
        }
      } else {
        throw apiError
      }
    }

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
  
  // Check rate limit BEFORE making API call
  if (rateLimitDoc.exists) {
    const rateLimitData = rateLimitDoc.data()
    const lastRequest = rateLimitData?.lastRequest || 0
    const count = rateLimitData?.count || 0
    
    // Reset count if last request was more than an hour ago
    if (lastRequest >= oneHourAgo) {
      // Check if limit exceeded
      if (count >= 10) {
        throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded. Please try again later.')
      }
    }
  }

  const { tasks, routines, categories, language = 'en' } = data

  if (!genAI) {
    throw new functions.https.HttpsError('failed-precondition', 'Gemini API not configured')
  }

  try {
    // Use gemini-pro model (most compatible)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    // Language instruction
    const languageInstruction = language === 'ar' 
      ? 'IMPORTANT: Respond in Arabic. All insights must be in Arabic.'
      : language === 'nl'
      ? 'IMPORTANT: Respond in Dutch. All insights must be in Dutch.'
      : 'IMPORTANT: Respond in English. All insights must be in English.'

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

${languageInstruction}

Total tasks: ${totalTasks}
Completed: ${completedTasks}
Completion rate: ${completionRate}%

Category performance:
${categoryStats.map((c: any) => `- ${c.name}: ${c.rate}% (${c.completed}/${c.total})`).join('\n')}

Generate 1-2 short, actionable insights (max 100 characters each) that would help the user improve their household management. Be positive and encouraging.

Return ONLY a JSON array of strings:
["Insight 1", "Insight 2"]

Do not include any markdown formatting, code blocks, or extra text. Just the JSON array.`

    let result, response, text
    try {
      result = await model.generateContent(prompt)
      response = result.response
      text = response.text()
    } catch (apiError: any) {
      console.error('Gemini API error:', apiError.message)
      // If model not found, try alternative
      if (apiError.message?.includes('not found') || apiError.message?.includes('404')) {
        console.log('Trying alternative model: gemini-1.5-pro')
        try {
          const altModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
          result = await altModel.generateContent(prompt)
          response = result.response
          text = response.text()
        } catch (altError: any) {
          console.error('Alternative model also failed:', altError.message)
          throw new functions.https.HttpsError('failed-precondition', `Gemini API error: ${apiError.message}. Please check your API key and model availability.`)
        }
      } else {
        throw apiError
      }
    }

    // Parse JSON from response
    let jsonText = text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }

    const insights = JSON.parse(jsonText)

    // Only increment rate limit AFTER successful API call
    if (rateLimitDoc.exists) {
      const rateLimitData = rateLimitDoc.data()
      const lastRequest = rateLimitData?.lastRequest || 0
      const count = rateLimitData?.count || 0
      
      if (lastRequest < oneHourAgo) {
        await rateLimitRef.set({
          count: 1,
          lastRequest: now
        }, { merge: true })
      } else {
        await rateLimitRef.set({
          count: count + 1,
          lastRequest: now
        }, { merge: true })
      }
    } else {
      await rateLimitRef.set({
        count: 1,
        lastRequest: now
      })
    }

    return { insights }
  } catch (error: any) {
    console.error('Error generating insights:', error)
    // Don't increment rate limit on error
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
 * Supports delay parameter to test notifications when browser is closed
 */
export const testPushNotification = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  const userId = context.auth.uid
  const { taskCount = 1, delaySeconds = 0 } = data

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

    // If delay is specified, wait before sending
    if (delaySeconds > 0) {
      // Return immediately and schedule the notification
      // Use setTimeout wrapped in a Promise
      await new Promise((resolve) => {
        setTimeout(async () => {
          try {
            await messaging.send(message)
            console.log(`Test notification sent after ${delaySeconds} seconds to user ${userId}`)
            resolve(undefined)
          } catch (error) {
            console.error('Error sending delayed notification:', error)
            resolve(undefined) // Don't throw, just log
          }
        }, delaySeconds * 1000)
      })
      
      return { 
        success: true, 
        message: `Test notification scheduled for ${delaySeconds} seconds. You can close the browser now!`,
        taskCount,
        delaySeconds
      }
    } else {
      // Send immediately
      await messaging.send(message)
      
      return { 
        success: true, 
        message: 'Test notification sent successfully!',
        taskCount 
      }
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

/**
 * Admin function to send a push notification to a specific user by their user ID
 * Can be called from Firebase Console or via HTTP request
 * Usage: Call this function with { userId: 'user-id-here', taskCount: 1, delaySeconds: 0 }
 */
export const sendNotificationToUser = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  // Handle data format - Firebase Console wraps data in 'data' field
  const requestData = data?.data || data
  const { userId, taskCount = 1, delaySeconds = 0 } = requestData

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new functions.https.HttpsError('invalid-argument', 'userId is required and must be a non-empty string')
  }

  // Validate taskCount
  const validTaskCount = typeof taskCount === 'number' && taskCount > 0 ? taskCount : 1
  const validDelaySeconds = typeof delaySeconds === 'number' && delaySeconds >= 0 ? delaySeconds : 0

  try {
    const db = admin.firestore()
    const messaging = admin.messaging()

    // Get user's FCM token
    const userDoc = await db.collection('users').doc(userId).get()
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', `User ${userId} not found`)
    }

    const userData = userDoc.data()
    const fcmToken = userData?.fcmToken

    if (!fcmToken) {
      throw new functions.https.HttpsError('failed-precondition', `User ${userId} has no FCM token. Please enable notifications first.`)
    }

    // Prepare notification
    const title = validTaskCount === 1 
      ? '🧪 Admin Test: 1 task due today! 📋'
      : `🧪 Admin Test: ${validTaskCount} tasks due today! 📋`
    
    const body = validTaskCount === 1
      ? 'This is an admin test notification. You have 1 task to complete today.'
      : `This is an admin test notification. You have ${validTaskCount} tasks to complete today.`

    // Send FCM notification
    const message = {
      notification: {
        title,
        body
      },
      data: {
        type: 'admin-test-notification',
        url: 'https://household-chores-d8eae.web.app'
      },
      token: fcmToken,
      webpush: {
        notification: {
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'admin-test-notification'
        }
      }
    }

    // If delay is specified, wait before sending
    if (validDelaySeconds > 0) {
      await new Promise((resolve) => {
        setTimeout(async () => {
          try {
            await messaging.send(message)
            console.log(`Admin notification sent after ${validDelaySeconds} seconds to user ${userId}`)
            resolve(undefined)
          } catch (error) {
            console.error('Error sending delayed admin notification:', error)
            resolve(undefined)
          }
        }, validDelaySeconds * 1000)
      })
      
      return { 
        success: true, 
        message: `Admin notification scheduled for ${validDelaySeconds} seconds to user ${userId}`,
        taskCount: validTaskCount,
        delaySeconds: validDelaySeconds
      }
    } else {
      // Send immediately
      await messaging.send(message)
      
      return { 
        success: true, 
        message: `Admin notification sent successfully to user ${userId}`,
        taskCount: validTaskCount
      }
    }
  } catch (error: any) {
    console.error('Error sending admin notification:', error)
    
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      // Update user to remove invalid token
      await admin.firestore().collection('users').doc(userId).update({
        notificationEnabled: false,
        fcmToken: admin.firestore.FieldValue.delete()
      })
      throw new functions.https.HttpsError('invalid-argument', 'Invalid FCM token. User notifications disabled.')
    }
    
    throw new functions.https.HttpsError('internal', `Failed to send admin notification: ${error.message}`)
  }
})

