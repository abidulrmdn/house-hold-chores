import { useState } from 'react'
import { motion, useMotionValue, useTransform, PanInfo, animate } from 'framer-motion'
import { TaskInstance } from '@/types'
import { Check, AlertCircle, X, Edit2 } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { useRoutineStore } from '@/store/useRoutineStore'
import { useAuthStore } from '@/store/useAuthStore'
import EditTaskModal from './EditTaskModal'

interface SwipeableTaskCardProps {
  task: TaskInstance
  routineName: string
  categoryColor?: string
  assignedUserName?: string
}

const SWIPE_THRESHOLD = 60 // Reduced from 100 for shorter swipe

export default function SwipeableTaskCard({ 
  task, 
  routineName, 
  categoryColor = '#6366f1',
  assignedUserName 
}: SwipeableTaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const x = useMotionValue(0)
  const { completeTask, uncompleteTask } = useRoutineStore()
  const { user } = useAuthStore()

  // Background colors for swipe actions - adjusted for shorter swipe
  const rightBgOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const leftBgOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])
  
  // Text opacity for action labels
  const rightTextOpacity = useTransform(x, [30, SWIPE_THRESHOLD], [0, 1])
  const leftTextOpacity = useTransform(x, [-SWIPE_THRESHOLD, -30], [1, 0])

  const getStatusColor = () => {
    if (task.isCompleted) return 'bg-gray-100 border-gray-300 opacity-60'
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
    const velocity = info.velocity.x
    const currentX = x.get()

    if (!user) {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 })
      return
    }

    // Use currentX (actual position) for more reliable detection
    const swipeRight = (currentX > SWIPE_THRESHOLD || velocity > 300) && !task.isCompleted
    const swipeLeft = (currentX < -SWIPE_THRESHOLD || velocity < -300) && task.isCompleted

    if (swipeRight) {
      // Swipe right - complete
      setIsCompleting(true)
      try {
        await completeTask(task.id, user.uid)
        // Don't animate off screen - just reset position
        animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 })
      } catch (error) {
        console.error('Error completing task:', error)
        // Snap back on error
        animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 })
      } finally {
        setIsCompleting(false)
      }
    } else if (swipeLeft) {
      // Swipe left - undo
      setIsCompleting(true)
      try {
        await uncompleteTask(task.id)
        // Don't animate off screen - just reset position
        animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 })
      } catch (error) {
        console.error('Error uncompleting task:', error)
        // Snap back on error
        animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 })
      } finally {
        setIsCompleting(false)
      }
    } else {
      // Snap back if not enough swipe - use spring animation
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 })
    }
  }

  return (
    <div className="relative mb-3 overflow-hidden rounded-xl">
      {/* Background actions */}
      <div className="absolute inset-0 flex">
        {/* Right swipe - Complete action */}
        <motion.div
          style={{ opacity: rightBgOpacity }}
          className="flex-1 bg-green-500 flex items-center justify-end pr-6"
        >
          <motion.div
            style={{ opacity: rightTextOpacity }}
            className="flex items-center gap-2 text-white font-semibold"
          >
            <Check className="w-6 h-6" />
            <span>Complete</span>
          </motion.div>
        </motion.div>
        
        {/* Left swipe - Undo action */}
        {task.isCompleted && (
          <motion.div
            style={{ opacity: leftBgOpacity }}
            className="flex-1 bg-orange-500 flex items-center justify-start pl-6"
          >
            <motion.div
              style={{ opacity: leftTextOpacity }}
              className="flex items-center gap-2 text-white font-semibold"
            >
              <X className="w-6 h-6" />
              <span>Undo</span>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Task card */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={task.isCompleted ? { left: -150, right: 0 } : { left: 0, right: 150 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: 'grabbing' }}
        className={`relative ${getStatusColor()} border-2 rounded-xl p-4 cursor-grab active:cursor-grabbing`}
      >
        <div className="flex items-start justify-between">
          {!task.isCompleted && (
            <button
              onClick={async (e) => {
                e.stopPropagation()
                if (!user) return
                setIsCompleting(true)
                try {
                  await completeTask(task.id, user.uid)
                } catch (error) {
                  console.error('Error completing task:', error)
                } finally {
                  setIsCompleting(false)
                }
              }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-green-500 rounded-full p-2 hover:bg-green-600 transition-colors cursor-pointer z-10 pointer-events-auto"
              title="Mark as complete"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Check className="w-5 h-5 text-white" />
            </button>
          )}
          <div className={`flex-1 ${task.isCompleted ? '' : 'pl-12'}`}>
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: categoryColor }}
              />
              <h3 className={`font-semibold ${task.isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                {routineName}
              </h3>
            </div>
            
            <div className={`flex items-center gap-2 text-sm mb-2 ${task.isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
              <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
              <span>•</span>
              <span className="font-medium">{assignedUserName || 'Unassigned'}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                task.isCompleted 
                  ? 'bg-gray-200 text-gray-600' 
                  : task.missedCount > 0
                  ? 'bg-red-200 text-red-800'
                  : 'bg-gray-200 text-gray-800'
              }`}>
                {getStatusText()}
              </span>
              {task.missedCount > 0 && !task.isCompleted && (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsEditModalOpen(true)
              }}
              className="p-2 text-gray-600 hover:text-primary-600 transition-colors cursor-pointer pointer-events-auto"
              title="Edit task"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {task.isCompleted && (
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  setIsCompleting(true)
                  try {
                    await uncompleteTask(task.id)
                  } catch (error) {
                    console.error('Error uncompleting task:', error)
                  } finally {
                    setIsCompleting(false)
                  }
                }}
                className="bg-gray-400 rounded-full p-2 hover:bg-orange-500 transition-colors cursor-pointer pointer-events-auto"
                title="Mark as incomplete"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <X className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>

        {isCompleting && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}
      </motion.div>

      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={task}
        routineName={routineName}
      />
    </div>
  )
}

