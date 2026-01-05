import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { TaskInstance, Frequency } from '@/types'
import { useRoutineStore } from '@/store/useRoutineStore'
import { useHouseholdStore } from '@/store/useHouseholdStore'
import toast from 'react-hot-toast'

interface EditTaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: TaskInstance
  routineName?: string
}

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' }
]

export default function EditTaskModal({ isOpen, onClose, task, routineName }: EditTaskModalProps) {
  const { updateTask, updateRoutine, routines } = useRoutineStore()
  const { household } = useHouseholdStore()
  const [assignedTo, setAssignedTo] = useState(task.assignedTo)
  const [dueDate, setDueDate] = useState(new Date(task.dueDate).toISOString().split('T')[0])
  const [frequency, setFrequency] = useState<Frequency>('weekly')
  const [householdMembers, setHouseholdMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Get the routine for this task
  const routine = routines.find(r => r.id === task.routineId)

  useEffect(() => {
    if (isOpen) {
      fetchHouseholdMembers()
      if (routine) {
        setFrequency(routine.frequency)
      }
    }
  }, [isOpen, household?.members, routine])

  const fetchHouseholdMembers = async () => {
    try {
      if (!household?.members) return

      const { doc: docFn, getDoc: getDocFn } = await import('firebase/firestore')
      const { db } = await import('@/firebase/config')
      if (!db) return

      const memberPromises = household.members.map(async (memberId: string) => {
        try {
          const userDoc = await getDocFn(docFn(db, 'users', memberId))
          if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() }
          }
          return null
        } catch (error) {
          console.error(`Error fetching user ${memberId}:`, error)
          return null
        }
      })
      const members = (await Promise.all(memberPromises)).filter(Boolean)
      setHouseholdMembers(members)
    } catch (error) {
      console.error('Error fetching household members:', error)
    }
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Update task
      const taskUpdates: Partial<TaskInstance> = {
        assignedTo,
        dueDate: new Date(dueDate).getTime()
      }
      await updateTask(task.id, taskUpdates)

      // Update routine frequency if changed
      if (routine && frequency !== routine.frequency) {
        await updateRoutine(routine.id, { frequency })
        toast.success('Task and routine updated successfully')
      } else {
        toast.success('Task updated successfully')
      }
      
      onClose()
    } catch (error: any) {
      console.error('Error updating task:', error)
      toast.error(error.message || 'Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Edit Task</h2>
            {routineName && (
              <p className="text-sm text-gray-500 mt-0.5">{routineName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign To
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              {householdMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.displayName || member.email || member.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {routine && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Routine Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Frequency)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                {FREQUENCIES.map(freq => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Changing frequency will affect future task generation for this routine
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Task'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

