import { useState, useEffect, useRef } from 'react'
import { X, Upload, X as XIcon } from 'lucide-react'
import { TaskInstance, Frequency } from '@/types'
import { useRoutineStore } from '@/store/useRoutineStore'
import { useHouseholdStore } from '@/store/useHouseholdStore'
import { storage } from '@/firebase/config'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
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
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' }
]

export default function EditTaskModal({ isOpen, onClose, task, routineName }: EditTaskModalProps) {
  const { updateTask, updateRoutine, routines } = useRoutineStore()
  const { household } = useHouseholdStore()
  const [assignedTo, setAssignedTo] = useState(task.assignedTo)
  const [dueDate, setDueDate] = useState(new Date(task.dueDate).toISOString().split('T')[0])
  const [frequency, setFrequency] = useState<Frequency>('weekly')
  const [householdMembers, setHouseholdMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState(task.notes || '')
  const [photos, setPhotos] = useState<string[]>(task.photos || [])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // Get the routine for this task
  const routine = routines.find(r => r.id === task.routineId)

  useEffect(() => {
    if (isOpen) {
      fetchHouseholdMembers()
      if (routine) {
        setFrequency(routine.frequency)
      }
      setNotes(task.notes || '')
      setPhotos(task.photos || [])
    }
  }, [isOpen, household?.members, routine, task.notes, task.photos])

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setUploadingPhotos(true)
    try {
      if (!storage || !task.id) {
        throw new Error('Storage not initialized')
      }

      const storageRef = ref(storage, `task-photos/${task.id}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      setPhotos(prev => [...prev, downloadURL])
      toast.success('Photo uploaded!')
    } catch (error: any) {
      console.error('Error uploading photo:', error)
      toast.error(`Failed to upload: ${error.message || 'Unknown error'}`)
    } finally {
      setUploadingPhotos(false)
      if (photoInputRef.current) {
        photoInputRef.current.value = ''
      }
    }
  }

  const handleRemovePhoto = async (photoURL: string, index: number) => {
    try {
      // Try to delete from storage if it's a Firebase Storage URL
      if (photoURL.includes('firebasestorage.googleapis.com') && storage) {
        try {
          // Extract the path from the full URL
          const urlParts = photoURL.split('/o/')
          if (urlParts.length > 1) {
            const pathPart = urlParts[1].split('?')[0]
            const decodedPath = decodeURIComponent(pathPart)
            const photoRef = ref(storage, decodedPath)
            await deleteObject(photoRef)
          }
        } catch (error) {
          // If deletion fails, just remove from array
          console.warn('Could not delete photo from storage:', error)
        }
      }
      setPhotos(prev => prev.filter((_, i) => i !== index))
      toast.success('Photo removed')
    } catch (error: any) {
      console.error('Error removing photo:', error)
      toast.error('Failed to remove photo')
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
        dueDate: new Date(dueDate).getTime(),
        notes: notes.trim() || undefined,
        photos: photos.length > 0 ? photos : undefined
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Edit Task</h2>
            {routineName && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{routineName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assign To
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {routine && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Routine Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Frequency)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                {FREQUENCIES.map(freq => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Changing frequency will affect future task generation for this routine
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Add notes about this task..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Photos
            </label>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhotos}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {uploadingPhotos ? 'Uploading...' : 'Upload Photo'}
            </button>
            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {photos.map((photoURL, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photoURL}
                      alt={`Task photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photoURL, index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

