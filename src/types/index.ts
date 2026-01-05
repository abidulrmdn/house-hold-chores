export type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly'

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
}

export interface Routine {
  id: string
  name: string
  description?: string
  categoryId: string
  frequency: Frequency
  assignedTo: string[] // User IDs
  householdId: string
  createdAt: number
  createdBy: string
  isActive: boolean
}

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
}

export interface Household {
  id: string
  name: string
  members: string[] // User IDs
  createdAt: number
  createdBy: string
}

