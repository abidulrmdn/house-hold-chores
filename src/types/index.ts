export type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'

export interface Category {
  id: string
  name: string
  color: string
  householdId: string
  createdAt: number
}

export interface User {
  id: string
  email: string
  displayName: string
  photoURL?: string
  householdId?: string
  createdAt: number
  language?: 'en' | 'nl' | 'ar' // User's preferred language
}

export interface Routine {
  id: string
  name: string
  categoryId: string
  frequency: Frequency
  assignedTo: string[] // User IDs
  householdId: string
  createdAt: number
  createdBy: string
  isActive: boolean
  reminderTime?: number // Minutes before due date to send reminder (e.g., 60 = 1 hour before)
  reminderEnabled?: boolean // Whether reminders are enabled for this routine
  notes?: string // Optional notes for the routine
  estimatedDuration?: number // Estimated duration in minutes
}

export type Priority = 'low' | 'medium' | 'high'

export interface TaskInstance {
  id: string
  routineId: string
  dueDate: number // Timestamp
  completedDate?: number // Timestamp
  assignedTo: string // User ID
  completedBy?: string // User ID
  isCompleted: boolean
  missedCount: number // Streak of missed tasks
  householdId: string
  createdAt: number
  priority?: Priority // Optional priority field
  notes?: string // Optional notes
  photos?: string[] // Optional photo URLs
}

export interface Household {
  id: string
  name: string
  members: string[] // User IDs
  createdAt: number
  createdBy: string
}

