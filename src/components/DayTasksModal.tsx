import { useMemo } from 'react'
import { X, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { TaskInstance, Routine, Category, User as UserType } from '@/types'
import { format, isToday, isPast } from 'date-fns'
import SwipeableTaskCard from './SwipeableTaskCard'

interface DayTasksModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date | null
  tasks: TaskInstance[]
  routines: Routine[]
  categories: Category[]
  users: UserType[]
}

export default function DayTasksModal({
  isOpen,
  onClose,
  date,
  tasks,
  routines,
  categories,
  users
}: DayTasksModalProps) {
  const dayTasks = useMemo(() => {
    if (!date) return []
    
    const dateKey = format(date, 'yyyy-MM-dd')
    return tasks.filter(task => {
      const taskDateKey = format(new Date(task.dueDate), 'yyyy-MM-dd')
      return taskDateKey === dateKey
    })
  }, [tasks, date])

  const sortedTasks = useMemo(() => {
    const sorted = [...dayTasks]
    // Sort: incomplete first, then by due date
    sorted.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1
      }
      return a.dueDate - b.dueDate
    })
    return sorted
  }, [dayTasks])

  const completedCount = dayTasks.filter(t => t.isCompleted).length
  const incompleteCount = dayTasks.length - completedCount
  const overdueCount = dayTasks.filter(t => !t.isCompleted && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))).length

  if (!isOpen || !date) return null

  const getRoutine = (routineId: string) => {
    return routines.find(r => r.id === routineId)
  }

  const getCategory = (categoryId?: string) => {
    if (!categoryId) return null
    return categories.find(c => c.id === categoryId)
  }

  const getAssignedUser = (userId: string) => {
    return users.find(u => u.id === userId)
  }

  const dateFormatted = format(date, 'EEEE, MMMM d, yyyy')
  const isTodayDate = isToday(date)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {dateFormatted}
                {isTodayDate && (
                  <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">(Today)</span>
                )}
              </h2>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {completedCount} completed
                </span>
                {incompleteCount > 0 && (
                  <span className={`flex items-center gap-1 ${overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {overdueCount > 0 ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    {incompleteCount} incomplete
                    {overdueCount > 0 && ` (${overdueCount} overdue)`}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto p-6">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">No tasks for this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTasks.map(task => {
                const routine = getRoutine(task.routineId)
                const category = routine ? getCategory(routine.categoryId) : null
                const assignedUser = getAssignedUser(task.assignedTo)

                return (
                  <SwipeableTaskCard
                    key={task.id}
                    task={task}
                    routineName={routine?.name || 'Unknown Task'}
                    categoryColor={category?.color || '#6366f1'}
                    assignedUserName={assignedUser?.displayName}
                    assignedUserPhotoURL={assignedUser?.photoURL}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

