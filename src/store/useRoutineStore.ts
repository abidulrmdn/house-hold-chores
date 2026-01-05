import { create } from 'zustand'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  Timestamp,
  orderBy,
  onSnapshot
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { Routine, TaskInstance, Category, Frequency } from '@/types'
import { addDays, addWeeks, addMonths, startOfDay, isBefore } from 'date-fns'

interface RoutineState {
  routines: Routine[]
  tasks: TaskInstance[]
  categories: Category[]
  loading: boolean
  fetchRoutines: (householdId: string) => Promise<void>
  fetchTasks: (householdId: string, userId?: string) => Promise<void>
  fetchCategories: (householdId: string) => Promise<void>
  createRoutine: (routine: Omit<Routine, 'id' | 'createdAt'>) => Promise<string>
  createCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Promise<string>
  completeTask: (taskId: string, userId: string) => Promise<void>
  subscribeToTasks: (householdId: string, userId?: string) => () => void
  generateTaskInstances: (routineId: string, routine: Omit<Routine, 'id' | 'createdAt'>) => Promise<void>
  checkAndUpdateMissedTasks: () => Promise<void>
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  routines: [],
  tasks: [],
  categories: [],
  loading: false,

  fetchRoutines: async (householdId: string) => {
    set({ loading: true })
    try {
      const q = query(
        collection(db, 'routines'),
        where('householdId', '==', householdId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      const routines = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Routine))
      set({ routines, loading: false })
    } catch (error) {
      console.error('Error fetching routines:', error)
      set({ loading: false })
    }
  },

  fetchTasks: async (householdId: string, userId?: string) => {
    set({ loading: true })
    try {
      let q
      
      if (userId) {
        q = query(
          collection(db, 'taskInstances'),
          where('householdId', '==', householdId),
          where('assignedTo', '==', userId),
          orderBy('dueDate', 'asc')
        )
      } else {
        q = query(
          collection(db, 'taskInstances'),
          where('householdId', '==', householdId),
          orderBy('dueDate', 'asc')
        )
      }

      const snapshot = await getDocs(q)
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toMillis?.() || doc.data().dueDate,
        completedDate: doc.data().completedDate?.toMillis?.() || doc.data().completedDate,
        createdAt: doc.data().createdAt?.toMillis?.() || doc.data().createdAt
      } as TaskInstance))
      set({ tasks, loading: false })
    } catch (error) {
      console.error('Error fetching tasks:', error)
      set({ loading: false })
    }
  },

  fetchCategories: async (householdId: string) => {
    try {
      const q = query(
        collection(db, 'categories'),
        where('householdId', '==', householdId),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Category))
      set({ categories })
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  },

  createRoutine: async (routineData) => {
    try {
      const routine: Omit<Routine, 'id'> = {
        ...routineData,
        createdAt: Date.now()
      }
      const docRef = await addDoc(collection(db, 'routines'), routine)
      
      // Create initial task instances for the next period
      await get().generateTaskInstances(docRef.id, routineData)
      
      return docRef.id
    } catch (error) {
      console.error('Error creating routine:', error)
      throw error
    }
  },

  generateTaskInstances: async (routineId: string, routine: Omit<Routine, 'id' | 'createdAt'> | Routine) => {
    const routineData = routine as Routine
    
    const now = new Date()
    const instances: Omit<TaskInstance, 'id'>[] = []

    // Generate tasks for the next 3 periods
    for (let i = 0; i < 3; i++) {
      let dueDate: Date
      
      switch (routineData.frequency) {
        case 'daily':
          dueDate = addDays(now, i + 1)
          break
        case 'weekly':
          dueDate = addWeeks(now, i + 1)
          break
        case 'biweekly':
          dueDate = addWeeks(now, (i + 1) * 2)
          break
        case 'monthly':
          dueDate = addMonths(now, i + 1)
          break
      }

      // Create instance for each assigned user
      for (const userId of routineData.assignedTo) {
        instances.push({
          routineId,
          dueDate: startOfDay(dueDate).getTime(),
          assignedTo: userId,
          isCompleted: false,
          missedCount: 0,
          householdId: routineData.householdId,
          createdAt: Date.now()
        })
      }
    }

    // Batch create instances
    const batch = instances.map(instance => 
      addDoc(collection(db, 'taskInstances'), instance)
    )
    await Promise.all(batch)
  },

  createCategory: async (categoryData) => {
    try {
      const category: Omit<Category, 'id'> = {
        ...categoryData,
        createdAt: Date.now()
      }
      const docRef = await addDoc(collection(db, 'categories'), category)
      return docRef.id
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  },

  completeTask: async (taskId: string, userId: string) => {
    try {
      const { tasks } = get()
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      await updateDoc(doc(db, 'taskInstances', taskId), {
        isCompleted: true,
        completedDate: Date.now(),
        completedBy: userId
      })

      // If this task was overdue, check if we need to generate new instances
      const now = startOfDay(new Date())
      const dueDate = startOfDay(new Date(task.dueDate))
      
      if (isBefore(dueDate, now)) {
        // Task was overdue, generate next instance
        const routine = get().routines.find(r => r.id === task.routineId)
        if (routine) {
          await get().generateTaskInstances(routine.id, routine)
        }
      }
    } catch (error) {
      console.error('Error completing task:', error)
      throw error
    }
  },

  subscribeToTasks: (householdId: string, userId?: string) => {
    let q
    
    if (userId) {
      q = query(
        collection(db, 'taskInstances'),
        where('householdId', '==', householdId),
        where('assignedTo', '==', userId),
        orderBy('dueDate', 'asc')
      )
    } else {
      q = query(
        collection(db, 'taskInstances'),
        where('householdId', '==', householdId),
        orderBy('dueDate', 'asc')
      )
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toMillis?.() || doc.data().dueDate,
        completedDate: doc.data().completedDate?.toMillis?.() || doc.data().completedDate,
        createdAt: doc.data().createdAt?.toMillis?.() || doc.data().createdAt
      } as TaskInstance))
      set({ tasks })
    }, (error) => {
      console.error('Error in task subscription:', error)
    })

    return unsubscribe
  },

  checkAndUpdateMissedTasks: async () => {
    const { tasks, routines } = get()
    const now = startOfDay(new Date())
    
    for (const task of tasks) {
      if (task.isCompleted) continue
      
      const dueDate = startOfDay(new Date(task.dueDate))
      const nextDueDate = new Date(dueDate)
      
      // Calculate next due date based on frequency
      const routine = routines.find(r => r.id === task.routineId)
      if (!routine) continue
      
      switch (routine.frequency) {
        case 'daily':
          nextDueDate.setDate(nextDueDate.getDate() + 1)
          break
        case 'weekly':
          nextDueDate.setDate(nextDueDate.getDate() + 7)
          break
        case 'biweekly':
          nextDueDate.setDate(nextDueDate.getDate() + 14)
          break
        case 'monthly':
          nextDueDate.setMonth(nextDueDate.getMonth() + 1)
          break
      }
      
      // If we've passed the next due date, this task is missed
      if (isBefore(nextDueDate, now)) {
        // Mark previous as done (with missed count), create new one with incremented missed count
        await updateDoc(doc(db, 'taskInstances', task.id), {
          isCompleted: true,
          completedDate: Date.now(),
          missedCount: task.missedCount
        })
        
        // Create new task instance with incremented missed count
        await addDoc(collection(db, 'taskInstances'), {
          routineId: task.routineId,
          dueDate: startOfDay(nextDueDate).getTime(),
          assignedTo: task.assignedTo,
          isCompleted: false,
          missedCount: task.missedCount + 1,
          householdId: task.householdId,
          createdAt: Date.now()
        })
      }
    }
  }
}))

