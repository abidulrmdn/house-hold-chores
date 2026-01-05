import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Frequency } from '@/types'
import { useRoutineStore } from '@/store/useRoutineStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useHouseholdStore } from '@/store/useHouseholdStore'
import toast from 'react-hot-toast'

interface CreateRoutineModalProps {
  isOpen: boolean
  onClose: () => void
  householdId: string
}

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' }
]

const COLORS = [
  '#6366f1', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
]

export default function CreateRoutineModal({ isOpen, onClose, householdId }: CreateRoutineModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('weekly')
  const [categoryId, setCategoryId] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [categoryColor, setCategoryColor] = useState(COLORS[0])
  const [assignedTo, setAssignedTo] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [householdMembers, setHouseholdMembers] = useState<any[]>([])
  const { createRoutine, createCategory, categories, fetchCategories } = useRoutineStore()
  const { userData } = useAuthStore()
  const { household } = useHouseholdStore()

  useEffect(() => {
    if (isOpen && householdId) {
      fetchCategories(householdId)
      fetchHouseholdMembers()
    }
  }, [isOpen, householdId])

  const fetchHouseholdMembers = async () => {
    if (!household?.members || !household.members.length) {
      // If no members, at least show current user
      if (userData) {
        setHouseholdMembers([userData])
      }
      return
    }
    try {
      const { doc, getDoc } = await import('firebase/firestore')
      const { db } = await import('@/firebase/config')
      if (!db) {
        if (userData) {
          setHouseholdMembers([userData])
        }
        return
      }
      
      const memberPromises = household.members.map(async (memberId) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', memberId))
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
      setHouseholdMembers(members.length > 0 ? members : (userData ? [userData] : []))
    } catch (error) {
      console.error('Error fetching household members:', error)
      if (userData) {
        setHouseholdMembers([userData])
      }
    }
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData) return

    try {
      let finalCategoryId = categoryId

      // Create category if new one is specified
      if (!categoryId && categoryName) {
        finalCategoryId = await createCategory({
          name: categoryName,
          color: categoryColor,
          householdId
        })
        await fetchCategories(householdId)
      }

      if (!finalCategoryId) {
        toast.error('Please select or create a category')
        return
      }

      const routineData: any = {
        name,
        description,
        categoryId: finalCategoryId,
        frequency,
        assignedTo: assignedTo.length > 0 ? assignedTo : [userData.id],
        householdId,
        createdBy: userData.id,
        isActive: true
      }
      
      if (startDate) {
        routineData.startDate = new Date(startDate).getTime()
      }
      
      await createRoutine(routineData)

      toast.success('Routine created!')
      onClose()
      setName('')
      setDescription('')
      setCategoryId('')
      setCategoryName('')
      setAssignedTo([])
      setStartDate('')
    } catch (error) {
      console.error('Error creating routine:', error)
      toast.error('Failed to create routine')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Create Routine</h2>
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
              Routine Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Clean bathroom"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Optional description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency *
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value)
                setCategoryName('') // Clear new category name when selecting existing
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-2"
              required
            >
              <option value="">Select existing category</option>
              {categories.filter(cat => cat.householdId === householdId).map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="text-sm text-gray-500 mb-2">Or create new:</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Category name"
                disabled={!!categoryId}
              />
              <div className="flex gap-1">
                {COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCategoryColor(color)}
                    disabled={!!categoryId}
                    className={`w-10 h-10 rounded-lg border-2 ${
                      categoryColor === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign To
            </label>
            <div className="space-y-2">
              {householdMembers.length > 0 ? (
                householdMembers.map(member => (
                  <label key={member.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignedTo.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignedTo([...assignedTo, member.id])
                        } else {
                          setAssignedTo(assignedTo.filter(id => id !== member.id))
                        }
                      }}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">
                      {member.displayName || member.email || member.id}
                      {member.id === userData?.id && ' (You)'}
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500">No other members in household</p>
              )}
            </div>
            {assignedTo.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">If none selected, will be assigned to you</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date (Optional)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              First task will start from this date. If not set, starts from today.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Create Routine
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

