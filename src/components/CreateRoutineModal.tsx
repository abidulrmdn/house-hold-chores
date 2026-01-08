import { useState, useEffect } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { Frequency } from '@/types'
import { useRoutineStore } from '@/store/useRoutineStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useHouseholdStore } from '@/store/useHouseholdStore'
import { parseNaturalLanguageTask } from '@/services/aiService'
import toast from 'react-hot-toast'

interface CreateRoutineModalProps {
  isOpen: boolean
  onClose: () => void
  householdId: string
  initialSuggestion?: {
    name: string
    frequency: string
    category?: string
    reason?: string
  } | null
}

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' }
]

const COLORS = [
  '#6366f1', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
]

export default function CreateRoutineModal({ isOpen, onClose, householdId, initialSuggestion }: CreateRoutineModalProps) {
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('weekly')
  const [categoryId, setCategoryId] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [categoryColor, setCategoryColor] = useState(COLORS[0])
  const [assignedTo, setAssignedTo] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState('60') // Default: 60 minutes before
  const [householdMembers, setHouseholdMembers] = useState<any[]>([])
  const [notes, setNotes] = useState('')
  const [estimatedDuration, setEstimatedDuration] = useState('')
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('')
  const [isParsingNL, setIsParsingNL] = useState(false)
  const [showNLInput, setShowNLInput] = useState(false)
  const { createRoutine, createCategory, categories, fetchCategories } = useRoutineStore()
  const { userData } = useAuthStore()
  const { household } = useHouseholdStore()

  useEffect(() => {
    if (isOpen && householdId) {
      fetchCategories(householdId)
      fetchHouseholdMembers()
    }
  }, [isOpen, householdId, household?.members])

  // Pre-fill form if suggestion is provided
  useEffect(() => {
    if (initialSuggestion && isOpen) {
      setName(initialSuggestion.name)
      setFrequency(initialSuggestion.frequency as Frequency)
      if (initialSuggestion.category) {
        // Try to find existing category or set as new category name
        const existingCategory = categories.find(c => 
          c.name.toLowerCase() === initialSuggestion.category?.toLowerCase()
        )
        if (existingCategory) {
          setCategoryId(existingCategory.id)
        } else {
          setCategoryName(initialSuggestion.category)
        }
      }
    }
  }, [initialSuggestion, isOpen, categories])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('')
      setFrequency('weekly')
      setCategoryId('')
      setCategoryName('')
      setAssignedTo([])
      setStartDate('')
      setReminderEnabled(false)
      setReminderTime('60')
      setNotes('')
      setEstimatedDuration('')
      setNaturalLanguageInput('')
      setShowNLInput(false)
    }
  }, [isOpen])

  const handleNaturalLanguageParse = async () => {
    if (!naturalLanguageInput.trim()) {
      toast.error('Please enter a task description')
      return
    }

    setIsParsingNL(true)
    try {
      const parsed = await parseNaturalLanguageTask(naturalLanguageInput, categories)
      
      // Fill form with parsed data
      setName(parsed.name)
      setFrequency(parsed.frequency)
      
      // Try to find existing category or set as new
      const existingCategory = categories.find(c => 
        c.name.toLowerCase() === parsed.category.toLowerCase()
      )
      if (existingCategory) {
        setCategoryId(existingCategory.id)
        setCategoryName('')
      } else {
        setCategoryName(parsed.category)
        setCategoryId('')
      }
      
      toast.success('Task parsed successfully! Review and adjust if needed.')
      setNaturalLanguageInput('')
      setShowNLInput(false)
    } catch (error: any) {
      console.error('Error parsing natural language:', error)
      if (error.code === 'functions/not-found') {
        toast.error('AI features not deployed. Please deploy Firebase Functions first.')
      } else if (error.code === 'functions/failed-precondition') {
        toast.error('Gemini API not configured. Please set up your API key.')
      } else if (error.code === 'functions/resource-exhausted') {
        toast.error('Rate limit exceeded. Please try again later.')
      } else {
        toast.error('Failed to parse task. Please fill the form manually.')
      }
    } finally {
      setIsParsingNL(false)
    }
  }

  const fetchHouseholdMembers = async () => {
    try {
      const { doc, getDoc, collection, query, where, getDocs } = await import('firebase/firestore')
      const { db } = await import('@/firebase/config')
      if (!db) {
        console.warn('Firestore not initialized')
        if (userData) {
          setHouseholdMembers([userData])
        }
        return
      }
      
      console.log('Fetching household members for householdId:', householdId)
      console.log('Household object:', household)
      
      // Always fetch from Firestore to get the latest data
      const usersQuery = query(
        collection(db, 'users'),
        where('householdId', '==', householdId)
      )
      const usersSnapshot = await getDocs(usersQuery)
      const members = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      console.log('Found members from Firestore query:', members.length, members)
      
      // Also try to get members from household object as backup
      if (household?.members && household.members.length > 0) {
        console.log('Household members array:', household.members)
        const memberPromises = household.members.map(async (memberId: string) => {
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
        const membersFromHousehold = (await Promise.all(memberPromises)).filter(Boolean)
        console.log('Found members from household object:', membersFromHousehold.length, membersFromHousehold)
        
        // Merge both sources, removing duplicates
        const allMembers = [...members]
        membersFromHousehold.forEach(member => {
          if (member && !allMembers.find(m => m.id === member.id)) {
            allMembers.push(member)
          }
        })
        
        if (allMembers.length > 0) {
          console.log('Setting household members:', allMembers)
          setHouseholdMembers(allMembers)
          return
        }
      }
      
      if (members.length > 0) {
        console.log('Setting household members from query:', members)
        setHouseholdMembers(members)
      } else if (userData) {
        // At least show current user
        console.log('No members found, showing only current user')
        setHouseholdMembers([userData])
      } else {
        console.warn('No members found and no userData')
        setHouseholdMembers([])
      }
    } catch (error) {
      console.error('Error fetching household members:', error)
      if (userData) {
        setHouseholdMembers([userData])
      } else {
        setHouseholdMembers([])
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
      if (!categoryId && categoryName.trim()) {
        try {
          finalCategoryId = await createCategory({
            name: categoryName.trim(),
            color: categoryColor,
            householdId
          })
          // Wait a bit for Firestore to update
          await new Promise(resolve => setTimeout(resolve, 100))
          await fetchCategories(householdId)
        } catch (error) {
          console.error('Error creating category:', error)
          toast.error('Failed to create category')
          return
        }
      }

      if (!finalCategoryId) {
        toast.error('Please select or create a category')
        return
      }

      const routineData: any = {
        name,
        categoryId: finalCategoryId,
        frequency,
        assignedTo: assignedTo.length > 0 ? assignedTo : [userData.id],
        householdId,
        createdBy: userData.id,
        isActive: true,
        reminderEnabled: reminderEnabled
      }

      // Only add reminderTime if reminders are enabled and value is valid
      if (reminderEnabled && reminderTime) {
        const parsedTime = parseInt(reminderTime)
        if (!isNaN(parsedTime) && parsedTime > 0) {
          routineData.reminderTime = parsedTime
        }
      }

      // Only add notes if it has content
      if (notes.trim()) {
        routineData.notes = notes.trim()
      }

      // Only add estimatedDuration if it has a value
      if (estimatedDuration) {
        const parsedDuration = parseInt(estimatedDuration)
        if (!isNaN(parsedDuration) && parsedDuration > 0) {
          routineData.estimatedDuration = parsedDuration
        }
      }
      
      if (startDate) {
        routineData.startDate = new Date(startDate).getTime()
      }
      
      await createRoutine(routineData)

      toast.success('Routine created!')
      onClose()
      setName('')
      setCategoryId('')
      setCategoryName('')
      setAssignedTo([])
      setStartDate('')
      setReminderEnabled(false)
      setReminderTime('60')
      setNotes('')
      setEstimatedDuration('')
    } catch (error: any) {
      console.error('Error creating routine:', error)
      const errorMessage = error?.message || error?.code || 'Unknown error'
      toast.error(`Failed to create routine: ${errorMessage}`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-x-hidden">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Create Routine</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Natural Language Input */}
          {!showNLInput ? (
            <div className="flex justify-end -mt-1 -mr-1 sm:mt-0 sm:mr-0">
              <button
                type="button"
                onClick={() => setShowNLInput(true)}
                className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Create with AI</span>
                <span className="sm:hidden">AI</span>
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Natural Language Input
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowNLInput(false)
                    setNaturalLanguageInput('')
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={naturalLanguageInput}
                onChange={(e) => setNaturalLanguageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNaturalLanguageParse()}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-2"
                placeholder='e.g., "Clean bathroom every week" or "Vacuum living room twice a week"'
                disabled={isParsingNL}
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleNaturalLanguageParse}
                  disabled={isParsingNL || !naturalLanguageInput.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                  {isParsingNL ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Parsing...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Parse</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  Examples: "Wash dishes daily", "Change air filter every 3 months"
                </p>
              </div>
            </div>
          )}

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
              required={!categoryName}
            >
              <option value="">Select existing category (or create new below)</option>
              {categories.filter(cat => cat.householdId === householdId).map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="text-sm text-gray-500 mb-2">Or create new category:</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-0"
                placeholder="Category name"
                disabled={!!categoryId}
              />
              <div className="flex flex-wrap gap-1 sm:flex-nowrap">
                {COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCategoryColor(color)}
                    disabled={!!categoryId}
                    className={`w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-lg border-2 ${
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
              Assign To {householdMembers.length > 0 && `(${householdMembers.length} member${householdMembers.length > 1 ? 's' : ''})`}
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {householdMembers.length > 0 ? (
                householdMembers.map(member => (
                  <label key={member.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
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
                    <div className="flex items-center gap-2 flex-1">
                      {member.photoURL && (
                        <img 
                          src={member.photoURL} 
                          alt={member.displayName || member.email}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span className="text-sm text-gray-700">
                        {member.displayName || member.email || member.id}
                        {member.id === userData?.id && ' (You)'}
                      </span>
                    </div>
                  </label>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-2">No members found</p>
                  <p className="text-xs text-gray-400">If you just joined, try refreshing the page</p>
                </div>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Duration (Optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                min="1"
                placeholder="15"
                className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-600">minutes</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Helps identify quick tasks (15 min or less)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Add notes, description, or reminders for this routine..."
            />
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="reminderEnabled"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="reminderEnabled" className="text-sm font-medium text-gray-700">
                Enable Reminders
              </label>
            </div>
            {reminderEnabled && (
              <div className="ml-7">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remind Before Due Date
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    min="1"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <select
                    value={reminderTime.includes('1440') ? 'days' : reminderTime.includes('60') ? 'hours' : 'minutes'}
                    onChange={(e) => {
                      const current = parseInt(reminderTime)
                      if (e.target.value === 'days') {
                        setReminderTime((current / 1440).toString())
                      } else if (e.target.value === 'hours') {
                        setReminderTime((current / 60).toString())
                      } else {
                        setReminderTime(current.toString())
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  You'll receive a notification before each task is due.
                </p>
              </div>
            )}
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

