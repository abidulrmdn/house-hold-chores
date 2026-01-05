import { useMemo } from 'react'
import { TaskInstance, Routine, Category, User } from '@/types'
import SwipeableTaskCard from './SwipeableTaskCard'
import { format, startOfDay, isToday, isThisWeek, isPast } from 'date-fns'

interface TaskListProps {
  tasks: TaskInstance[]
  routines: Routine[]
  categories: Category[]
  users: User[]
  filter?: 'today' | 'week' | 'all' | 'my-tasks'
  currentUserId?: string
}

export default function TaskList({ 
  tasks, 
  routines, 
  categories, 
  users,
  filter = 'all',
  currentUserId 
}: TaskListProps) {
  const filteredTasks = useMemo(() => {
    let filtered = tasks

    // Filter by user if needed
    if (filter === 'my-tasks' && currentUserId) {
      filtered = filtered.filter(task => task.assignedTo === currentUserId)
    }

    // Filter by date
    if (filter === 'today') {
      filtered = filtered.filter(task => isToday(new Date(task.dueDate)))
    } else if (filter === 'week') {
      filtered = filtered.filter(task => isThisWeek(new Date(task.dueDate)))
    }

    // Sort: incomplete first, then by due date
    return filtered.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1
      }
      return a.dueDate - b.dueDate
    })
  }, [tasks, filter, currentUserId])

  const getRoutine = (routineId: string) => {
    return routines.find(r => r.id === routineId)
  }

  const getCategory = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)
  }

  const getUser = (userId: string) => {
    return users.find(u => u.id === userId)
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No tasks found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {filteredTasks.map(task => {
        const routine = getRoutine(task.routineId)
        if (!routine) return null

        const category = getCategory(routine.categoryId)
        const assignedUser = getUser(task.assignedTo)

        return (
          <SwipeableTaskCard
            key={task.id}
            task={task}
            routineName={routine.name}
            categoryColor={category?.color || '#6366f1'}
            assignedUserName={assignedUser?.displayName}
          />
        )
      })}
    </div>
  )
}

