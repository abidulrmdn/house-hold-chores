import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase/config'

// Initialize functions if available
let aiFunctions: {
  generateTaskSuggestions: ReturnType<typeof httpsCallable>
  parseTaskInput: ReturnType<typeof httpsCallable>
  generateInsights: ReturnType<typeof httpsCallable>
} | null = null

if (functions) {
  aiFunctions = {
    generateTaskSuggestions: httpsCallable(functions, 'generateTaskSuggestions'),
    parseTaskInput: httpsCallable(functions, 'parseTaskInput'),
    generateInsights: httpsCallable(functions, 'generateInsights')
  }
}

export interface TaskSuggestion {
  name: string
  frequency: string
  category?: string
  reason: string
}

export interface ParsedTask {
  name: string
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  category: string
}

/**
 * Generate smart task suggestions based on household data
 */
export async function getTaskSuggestions(
  routines: any[],
  categories: any[],
  tasks: any[],
  householdId: string
): Promise<TaskSuggestion[]> {
  if (!aiFunctions) {
    throw new Error('Firebase Functions not initialized')
  }

  try {
    const result = await aiFunctions.generateTaskSuggestions({
      routines,
      categories,
      tasks,
      householdId
    })

    return (result.data as any).suggestions || []
  } catch (error: any) {
    console.error('Error getting task suggestions:', error)
    throw error
  }
}

/**
 * Parse natural language input to create a routine
 */
export async function parseNaturalLanguageTask(
  input: string,
  existingCategories: any[]
): Promise<ParsedTask> {
  if (!aiFunctions) {
    throw new Error('Firebase Functions not initialized')
  }

  try {
    const result = await aiFunctions.parseTaskInput({
      input,
      existingCategories
    })

    return result.data as ParsedTask
  } catch (error: any) {
    console.error('Error parsing task input:', error)
    throw error
  }
}

/**
 * Generate smart insights based on task completion patterns
 */
export async function getSmartInsights(
  tasks: any[],
  routines: any[],
  categories: any[]
): Promise<string[]> {
  if (!aiFunctions) {
    throw new Error('Firebase Functions not initialized')
  }

  try {
    const result = await aiFunctions.generateInsights({
      tasks,
      routines,
      categories
    })

    return (result.data as any).insights || []
  } catch (error: any) {
    console.error('Error getting insights:', error)
    throw error
  }
}

