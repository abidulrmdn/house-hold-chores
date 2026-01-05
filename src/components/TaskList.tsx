import { useMemo, useState } from 'react'
import { TaskInstance, Routine, Category, User as UserType } from '@/types'
import SwipeableTaskCard from './SwipeableTaskCard'
import { isToday, startOfWeek, endOfWeek, isPast, isFuture } from 'date-fns'
import { CheckSquare, Calendar, Inbox, CheckCircle2, XCircle, User as UserIcon, X } from 'lucide-react'
import { useRoutineStore } from '@/store/useRoutineStore'
import { useAuthStore } from '@/store/useAuthStore'
import toast from 'react-hot-toast'

interface TaskListProps {
  tasks: TaskInstance[]
  routines: Routine[]
  categories: Category[]
  users: UserType[]
  filter?: 'today' | 'week' | 'all' | 'my-tasks'
  currentUserId?: string
  userFilter?: string | null
  searchQuery?: string
  sortBy?: 'dueDate' | 'assignee'
  quickFilter?: 'overdue' | 'today' | 'upcoming' | 'avoiding' | 'quick' | null
}

export default function TaskList({ 
  tasks, 
  routines = [], 
  categories, 
  users,
  filter = 'all',
  currentUserId,
  userFilter,
  searchQuery = '',
  sortBy = 'dueDate',
  quickFilter = null
}: TaskListProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const { completeTask, uncompleteTask, updateTask } = useRoutineStore()
  const { user } = useAuthStore()
  const filteredTasks = useMemo(() => {
    let filtered = tasks

    // Filter by user - prioritize userFilter, then my-tasks filter
    if (userFilter) {
      filtered = filtered.filter(task => task.assignedTo === userFilter)
    } else if (filter === 'my-tasks' && currentUserId) {
      filtered = filtered.filter(task => task.assignedTo === currentUserId)
    }

    // Filter by date
    if (filter === 'today') {
      filtered = filtered.filter(task => isToday(new Date(task.dueDate)))
    } else if (filter === 'week') {
      const now = new Date()
      const weekStart = startOfWeek(now, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.dueDate)
        return taskDate >= weekStart && taskDate <= weekEnd
      })
    }

    // Quick filters
    if (quickFilter === 'overdue') {
      filtered = filtered.filter(task => 
        !task.isCompleted && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))
      )
    } else if (quickFilter === 'today') {
      filtered = filtered.filter(task => isToday(new Date(task.dueDate)))
    } else if (quickFilter === 'upcoming') {
      filtered = filtered.filter(task => isFuture(new Date(task.dueDate)))
    } else if (quickFilter === 'avoiding') {
      // Tasks with high missed count (user has been avoiding)
      filtered = filtered.filter(task => 
        !task.isCompleted && task.missedCount >= 2
      )
    } else if (quickFilter === 'quick') {
      // Tasks that can be done quickly (estimated duration <= 15 minutes or no duration set)
      filtered = filtered.filter(task => {
        const routine = routines.find(r => r.id === task.routineId)
        return !routine?.estimatedDuration || routine.estimatedDuration <= 15
      })
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(task => {
        const routine = routines.find(r => r.id === task.routineId)
        const category = routine ? categories.find(c => c.id === routine.categoryId) : null
        const assignedUser = users.find(u => u.id === task.assignedTo)
        
        return (
          routine?.name.toLowerCase().includes(query) ||
          routine?.notes?.toLowerCase().includes(query) ||
          category?.name.toLowerCase().includes(query) ||
          assignedUser?.displayName.toLowerCase().includes(query) ||
          assignedUser?.email.toLowerCase().includes(query)
        )
      })
    }

    // Sort
    filtered.sort((a, b) => {
      // Always show incomplete tasks first
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1
      }

      if (sortBy === 'assignee') {
        const aUser = users.find(u => u.id === a.assignedTo)?.displayName || ''
        const bUser = users.find(u => u.id === b.assignedTo)?.displayName || ''
        if (aUser !== bUser) {
          return aUser.localeCompare(bUser)
        }
        // If same assignee, sort by due date
        return a.dueDate - b.dueDate
      } else {
        // Default: sort by due date
        return a.dueDate - b.dueDate
      }
    })

    return filtered
  }, [tasks, filter, currentUserId, userFilter, searchQuery, sortBy, quickFilter, routines, categories, users])

  const getRoutine = (routineId: string) => {
    return routines.find(r => r.id === routineId)
  }

  const getCategory = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)
  }

  const getUser = (userId: string) => {
    return users.find(u => u.id === userId)
  }

  // Better empty states
  if (filteredTasks.length === 0) {
    const getEmptyStateMessage = () => {
      if (searchQuery.trim()) {
        return {
          icon: Inbox,
          title: 'No tasks found',
          message: `No tasks match "${searchQuery}". Try a different search term.`
        }
      }
      if (quickFilter === 'overdue') {
        return {
          icon: CheckSquare,
          title: 'No overdue tasks',
          message: 'Great job! You\'re all caught up with no overdue tasks.'
        }
      }
      if (quickFilter === 'today') {
        return {
          icon: Calendar,
          title: 'No tasks today',
          message: 'You have no tasks scheduled for today. Enjoy your free time!'
        }
      }
      if (quickFilter === 'upcoming') {
        return {
          icon: Calendar,
          title: 'No upcoming tasks',
          message: 'You have no upcoming tasks. All tasks are either completed or overdue.'
        }
      }
      if (filter === 'today') {
        return {
          icon: Calendar,
          title: 'No tasks today',
          message: 'You have no tasks scheduled for today. Enjoy your free time!'
        }
      }
      if (filter === 'week') {
        return {
          icon: Calendar,
          title: 'No tasks this week',
          message: 'You have no tasks scheduled for this week. Great planning!'
        }
      }
      if (filter === 'my-tasks') {
        return {
          icon: CheckSquare,
          title: 'No tasks assigned to you',
          message: 'You don\'t have any tasks assigned to you right now.'
        }
      }
      return {
        icon: Inbox,
        title: 'No tasks found',
        message: 'Create your first routine to get started with task management!'
      }
    }

    const emptyState = getEmptyStateMessage()
    const Icon = emptyState.icon

    return (
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {emptyState.title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          {emptyState.message}
        </p>
      </div>
    )
  }

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedTasks(new Set(filteredTasks.map(t => t.id)))
  }

  const clearSelection = () => {
    setSelectedTasks(new Set())
    setIsSelectionMode(false)
  }

  const handleBulkComplete = async () => {
    const incompleteTasks = filteredTasks.filter(t => selectedTasks.has(t.id) && !t.isCompleted)
    if (incompleteTasks.length === 0) {
      toast.error('No incomplete tasks selected')
      return
    }

    if (!user?.uid) {
      toast.error('Please sign in to complete tasks')
      return
    }

    try {
      // Use current user's ID so they get credit for completing tasks
      await Promise.all(incompleteTasks.map(task => completeTask(task.id, user.uid)))
      toast.success(`Completed ${incompleteTasks.length} task${incompleteTasks.length > 1 ? 's' : ''}`)
      clearSelection()
    } catch (error) {
      toast.error('Failed to complete some tasks')
    }
  }

  const handleBulkUncomplete = async () => {
    const completedTasks = filteredTasks.filter(t => selectedTasks.has(t.id) && t.isCompleted)
    if (completedTasks.length === 0) {
      toast.error('No completed tasks selected')
      return
    }

    try {
      await Promise.all(completedTasks.map(task => uncompleteTask(task.id)))
      toast.success(`Uncompleted ${completedTasks.length} task${completedTasks.length > 1 ? 's' : ''}`)
      clearSelection()
    } catch (error) {
      toast.error('Failed to uncomplete some tasks')
    }
  }

  const handleBulkReassign = async (newUserId: string) => {
    const tasksToReassign = filteredTasks.filter(t => selectedTasks.has(t.id) && t.assignedTo !== newUserId)
    if (tasksToReassign.length === 0) {
      toast.error('No tasks to reassign')
      return
    }

    try {
      await Promise.all(tasksToReassign.map(task => updateTask(task.id, { assignedTo: newUserId })))
      toast.success(`Reassigned ${tasksToReassign.length} task${tasksToReassign.length > 1 ? 's' : ''}`)
      clearSelection()
    } catch (error) {
      toast.error('Failed to reassign some tasks')
    }
  }

  return (
    <div className="space-y-3">
      {/* Bulk Operations Bar */}
      {isSelectionMode && (
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-lg mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={selectAll}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                Select all
              </button>
            </div>
            <button
              onClick={clearSelection}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleBulkComplete}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete
            </button>
            <button
              onClick={handleBulkUncomplete}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Uncomplete
            </button>
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                <UserIcon className="w-4 h-4" />
                Reassign
              </button>
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[150px] hidden group-hover:block z-50">
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleBulkReassign(user.id)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                    {user.displayName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enable Selection Mode Button */}
      {!isSelectionMode && filteredTasks.length > 0 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setIsSelectionMode(true)}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            <CheckSquare className="w-4 h-4" />
            Select tasks
          </button>
        </div>
      )}

      {filteredTasks.map(task => {
        const routine = getRoutine(task.routineId)
        if (!routine) return null

        const category = getCategory(routine.categoryId)
        const assignedUser = getUser(task.assignedTo)
        const isSelected = selectedTasks.has(task.id)

        return (
          <div key={task.id} className="relative">
            {isSelectionMode && (
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleTaskSelection(task.id)}
                  className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                />
              </div>
            )}
            <div className={isSelectionMode ? 'ml-8' : ''}>
              <SwipeableTaskCard
                task={task}
                routineName={routine.name}
                categoryColor={category?.color || '#6366f1'}
                assignedUserName={assignedUser?.displayName}
                assignedUserPhotoURL={assignedUser?.photoURL}
                isSelectionMode={isSelectionMode}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
