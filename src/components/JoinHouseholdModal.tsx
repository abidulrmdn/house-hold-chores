import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { useHouseholdStore } from '@/store/useHouseholdStore'
import { useAuthStore } from '@/store/useAuthStore'
import toast from 'react-hot-toast'

interface JoinHouseholdModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialHouseholdId?: string | null
}

export default function JoinHouseholdModal({ isOpen, onClose, onSuccess, initialHouseholdId }: JoinHouseholdModalProps) {
  const [householdId, setHouseholdId] = useState('')
  const [loading, setLoading] = useState(false)
  const { joinHousehold } = useHouseholdStore()
  const { user, loadUserData } = useAuthStore()

  // Set initial household ID from URL if provided
  useEffect(() => {
    if (initialHouseholdId && isOpen) {
      setHouseholdId(initialHouseholdId)
    }
  }, [initialHouseholdId, isOpen])

  if (!isOpen) return null

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!householdId.trim()) {
      toast.error('Please enter a household ID')
      return
    }
    
    if (!user) {
      toast.error('You must be signed in to join a household')
      return
    }

    setLoading(true)
    try {
      console.log('Joining household:', householdId.trim(), 'for user:', user.uid)
      await joinHousehold(householdId.trim(), user.uid)
      console.log('Household joined, loading user data...')
      await loadUserData()
      console.log('User data loaded')
      toast.success('Successfully joined household!')
      setHouseholdId('')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error joining household:', error)
      const errorMessage = error.message || 'Failed to join household'
      
      if (errorMessage.includes('not found') || error.code === 'not-found') {
        toast.error('Household not found. Please check the Household ID.', {
          duration: 5000
        })
      } else if (errorMessage.includes('permission-denied') || error.code === 'permission-denied') {
        toast.error('Permission denied. Make sure Firestore is set up correctly.', {
          duration: 5000
        })
      } else {
        toast.error(errorMessage, {
          duration: 5000
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Join Household</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleJoin} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Household ID
            </label>
            <input
              type="text"
              value={householdId}
              onChange={(e) => setHouseholdId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
              placeholder="Enter household ID"
              required
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Get this from the household owner
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={!householdId.trim() || loading}
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Joining...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Join Household
                </>
              )}
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

