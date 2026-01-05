import { useState, useMemo } from 'react'
import { TaskInstance, Routine, Category, User as UserType } from '@/types'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isPast, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

interface CalendarViewProps {
  tasks: TaskInstance[]
  routines: Routine[]
  categories: Category[]
  users?: UserType[]
  onTaskClick?: (task: TaskInstance) => void
  onDayClick?: (date: Date) => void
}

export default function CalendarView({ tasks, routines, categories, onTaskClick, onDayClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get first day of month to calculate offset
  const firstDayOfWeek = monthStart.getDay()
  const offsetDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 // Monday = 0

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, TaskInstance[]> = {}
    tasks.forEach(task => {
      const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(task)
    })
    return grouped
  }, [tasks])

  const getTasksForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return tasksByDate[dateKey] || []
  }

  const getCategory = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)
  }

  const getRoutine = (routineId: string) => {
    return routines.find(r => r.id === routineId)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1))
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}

        {/* Offset days (empty cells before first day of month) */}
        {Array.from({ length: offsetDays }).map((_, i) => (
          <div key={`offset-${i}`} className="aspect-square" />
        ))}

        {/* Calendar days */}
        {monthDays.map(day => {
          const dayTasks = getTasksForDate(day)
          const completedCount = dayTasks.filter(t => t.isCompleted).length
          const incompleteCount = dayTasks.length - completedCount
          const isOverdue = incompleteCount > 0 && isPast(day) && !isToday(day)
          const isTodayDate = isToday(day)

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick?.(day)}
              className={`
                aspect-square border border-gray-200 dark:border-gray-700 rounded-lg p-1
                ${isTodayDate ? 'bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-700' : ''}
                ${isOverdue ? 'bg-red-50 dark:bg-red-900 border-red-300 dark:border-red-700' : ''}
                ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}
                hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer
              `}
            >
              <div className="flex flex-col h-full">
                <div className={`
                  text-sm font-medium mb-1
                  ${isTodayDate ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}
                `}>
                  {format(day, 'd')}
                </div>
                <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                  {dayTasks.slice(0, 3).map(task => {
                    const routine = getRoutine(task.routineId)
                    const category = routine ? getCategory(routine.categoryId) : null
                    return (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onTaskClick?.(task)
                        }}
                        className={`
                          text-xs px-1 py-0.5 rounded truncate
                          ${task.isCompleted 
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 line-through' 
                            : 'text-white'
                          }
                        `}
                        style={{
                          backgroundColor: task.isCompleted 
                            ? undefined 
                            : (category?.color || '#6366f1')
                        }}
                        title={routine?.name || 'Unknown task'}
                      >
                        {routine?.name || 'Task'}
                      </div>
                    )
                  })}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
                {dayTasks.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {completedCount > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" title={`${completedCount} completed`} />
                    )}
                    {incompleteCount > 0 && (
                      <div className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-red-500' : 'bg-yellow-500'}`} title={`${incompleteCount} incomplete`} />
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-50 dark:bg-blue-900 border border-blue-300 dark:border-blue-700" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-50 dark:bg-red-900 border border-red-300 dark:border-red-700" />
          <span>Overdue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          <span>Incomplete</span>
        </div>
      </div>
    </div>
  )
}

