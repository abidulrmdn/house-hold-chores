import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, useMotionValue, useTransform, PanInfo, animate } from 'framer-motion'
import { TaskInstance } from '@/types'
import { Check, AlertCircle, X, Edit2, MoreVertical, User, Calendar, FileText, Image as ImageIcon } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { useRoutineStore } from '@/store/useRoutineStore'
import { useAuthStore } from '@/store/useAuthStore'
import EditTaskModal from './EditTaskModal'

interface SwipeableTaskCardProps {
  task: TaskInstance
  routineName: string
  categoryColor?: string
  assignedUserName?: string
  assignedUserPhotoURL?: string
  isSelectionMode?: boolean
  onQuickAction?: (action: 'complete' | 'uncomplete' | 'reassign' | 'reschedule' | 'delete') => void
}

const SWIPE_THRESHOLD = 60 // Reduced from 100 for shorter swipe

export default function SwipeableTaskCard({ 
  task, 
  routineName, 
  categoryColor = '#6366f1',
  assignedUserName,
  assignedUserPhotoURL,
  isSelectionMode = false,
  onQuickAction
}: SwipeableTaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const { completeTask, uncompleteTask } = useRoutineStore()
  const { user } = useAuthStore()

  // Close menu when clicking outside or when edit modal opens
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsQuickMenuOpen(false)
      }
    }
    if (isQuickMenuOpen && !isEditModalOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    // Close menu when edit modal opens
    if (isEditModalOpen && isQuickMenuOpen) {
      setIsQuickMenuOpen(false)
    }
  }, [isQuickMenuOpen, isEditModalOpen])

  // Background colors for swipe actions - adjusted for shorter swipe
  const rightBgOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const leftBgOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])
  
  // Text opacity for action labels
  const rightTextOpacity = useTransform(x, [30, SWIPE_THRESHOLD], [0, 1])
  const leftTextOpacity = useTransform(x, [-SWIPE_THRESHOLD, -30], [1, 0])

  const getStatusColor = () => {
    if (task.isCompleted) return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60'
    if (task.missedCount > 0) return 'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700'
    if (isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate))) return 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700'
    if (isToday(new Date(task.dueDate))) return 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700'
    return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
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
    <div className="relative mb-3 overflow-visible rounded-xl z-0">
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
        drag={isSelectionMode ? false : "x"}
        dragConstraints={task.isCompleted ? { left: -150, right: 0 } : { left: 0, right: 150 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: 'grabbing' }}
        className={`relative ${getStatusColor()} border-2 rounded-xl p-4 ${isSelectionMode ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
        data-tutorial="task-card"
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
              <h3 className={`font-semibold ${task.isCompleted ? 'text-gray-500 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-100'}`}>
                {routineName}
              </h3>
            </div>
            
            <div className={`flex items-center gap-2 text-sm mb-2 ${task.isCompleted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>
              <span>{format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                {assignedUserPhotoURL && (
                  <img 
                    src={assignedUserPhotoURL} 
                    alt={assignedUserName || 'Assigned user'}
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <span className="font-medium">{assignedUserName || 'Unassigned'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                task.isCompleted 
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400' 
                  : task.missedCount > 0
                  ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-300'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              }`}>
                {getStatusText()}
              </span>
              {task.missedCount > 0 && !task.isCompleted && (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
            </div>
            
            {/* Notes */}
            {task.notes && (
              <div className="flex items-start gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
                <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="line-clamp-2">{task.notes}</p>
              </div>
            )}
            
            {/* Photos */}
            {task.photos && task.photos.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {task.photos.length} photo{task.photos.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            {!isSelectionMode && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsQuickMenuOpen(!isQuickMenuOpen)
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsQuickMenuOpen(true)
                  }}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer pointer-events-auto relative z-50"
                  title="Quick actions"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {isQuickMenuOpen && menuRef.current && createPortal(
                  <>
                    {/* Backdrop to capture clicks outside */}
                    <div
                      className="fixed inset-0 z-[9998]"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsQuickMenuOpen(false)
                      }}
                    />
                    {/* Menu dropdown */}
                    <div 
                      className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 py-2 min-w-[180px] z-[9999]"
                      style={{
                        top: `${menuRef.current.getBoundingClientRect().bottom + window.scrollY + 4}px`,
                        right: `${window.innerWidth - menuRef.current.getBoundingClientRect().right + window.scrollX}px`,
                        pointerEvents: 'auto'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                    {!task.isCompleted ? (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          setIsQuickMenuOpen(false)
                          if (onQuickAction) {
                            onQuickAction('complete')
                          } else if (user) {
                            setIsCompleting(true)
                            try {
                              await completeTask(task.id, user.uid)
                            } catch (error) {
                              console.error('Error completing task:', error)
                            } finally {
                              setIsCompleting(false)
                            }
                          }
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Complete
                      </button>
                    ) : (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          setIsQuickMenuOpen(false)
                          if (onQuickAction) {
                            onQuickAction('uncomplete')
                          } else {
                            setIsCompleting(true)
                            try {
                              await uncompleteTask(task.id)
                            } catch (error) {
                              console.error('Error uncompleting task:', error)
                            } finally {
                              setIsCompleting(false)
                            }
                          }
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Uncomplete
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsQuickMenuOpen(false)
                        if (onQuickAction) {
                          onQuickAction('reassign')
                        } else {
                          setIsEditModalOpen(true)
                        }
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Reassign
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsQuickMenuOpen(false)
                        if (onQuickAction) {
                          onQuickAction('reschedule')
                        } else {
                          setIsEditModalOpen(true)
                        }
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Reschedule
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        setIsQuickMenuOpen(false)
                        // Small delay to ensure menu closes before modal opens
                        setTimeout(() => {
                          setIsEditModalOpen(true)
                        }, 100)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                    </>
                  , document.body
                )}
              </div>
            )}
            {!isSelectionMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditModalOpen(true)
                }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer pointer-events-auto"
                title="Edit task"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {task.isCompleted && !isSelectionMode && (
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
          <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center rounded-xl">
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

