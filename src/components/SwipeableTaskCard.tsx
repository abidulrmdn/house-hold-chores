import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { TaskInstance } from '@/types'
import { Check, X, AlertCircle } from 'lucide-react'
import { format, isPast, isToday, isFuture } from 'date-fns'
import { useRoutineStore } from '@/store/useRoutineStore'
import { useAuthStore } from '@/store/useAuthStore'

interface SwipeableTaskCardProps {
  task: TaskInstance
  routineName: string
  categoryColor?: string
  assignedUserName?: string
}

const SWIPE_THRESHOLD = 100

export default function SwipeableTaskCard({ 
  task, 
  routineName, 
  categoryColor = '#6366f1',
  assignedUserName 
}: SwipeableTaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const x = useMotionValue(0)
  const { completeTask } = useRoutineStore()
  const { user } = useAuthStore()

  const opacity = useTransform(x, [-200, 0, 200], [0, 1, 0])
  const scale = useTransform(x, [-200, 0, 200], [0.8, 1, 0.8])

  const getStatusColor = () => {
    if (task.isCompleted) return 'bg-green-100 border-green-300'
    if (task.missedCount > 0) return 'bg-red-100 border-red-300'
    if (isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))) return 'bg-yellow-100 border-yellow-300'
    if (isToday(new Date(task.dueDate))) return 'bg-blue-100 border-blue-300'
    return 'bg-white border-gray-200'
  }

  const getStatusText = () => {
    if (task.isCompleted) return 'Completed'
    if (task.missedCount > 0) return `Missed ${task.missedCount} time${task.missedCount > 1 ? 's' : ''}`
    if (isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))) return 'Overdue'
    if (isToday(new Date(task.dueDate))) return 'Due Today'
    return 'Upcoming'
  }

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const offset = info.offset.x
    const velocity = info.velocity.x

    if (task.isCompleted || !user) return

    if (offset > SWIPE_THRESHOLD || velocity > 500) {
      // Swipe right - complete
      setIsCompleting(true)
      try {
        await completeTask(task.id, user.uid)
      } catch (error) {
        console.error('Error completing task:', error)
      } finally {
        setIsCompleting(false)
      }
    } else if (offset < -SWIPE_THRESHOLD || velocity < -500) {
      // Swipe left - could be used for other actions
    }

    x.set(0)
  }

  return (
    <motion.div
      style={{ x, opacity, scale }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className={`relative ${getStatusColor()} border-2 rounded-xl p-4 mb-3 cursor-grab active:cursor-grabbing`}
    >
      {!task.isCompleted && (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <div className="bg-green-500 rounded-full p-2">
            <Check className="w-6 h-6 text-white" />
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />
            <h3 className="font-semibold text-gray-800">{routineName}</h3>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
            {assignedUserName && (
              <>
                <span>•</span>
                <span>{assignedUserName}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              task.isCompleted 
                ? 'bg-green-200 text-green-800' 
                : task.missedCount > 0
                ? 'bg-red-200 text-red-800'
                : 'bg-gray-200 text-gray-800'
            }`}>
              {getStatusText()}
            </span>
            {task.missedCount > 0 && (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
          </div>
        </div>

        {task.isCompleted && (
          <div className="ml-4">
            <div className="bg-green-500 rounded-full p-2">
              <Check className="w-6 h-6 text-white" />
            </div>
          </div>
        )}
      </div>

      {isCompleting && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}
    </motion.div>
  )
}

