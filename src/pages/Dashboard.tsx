import { useState, useEffect } from 'react'
import { Plus, Calendar, CheckSquare, User, Bell, Home, Users } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useRoutineStore } from '@/store/useRoutineStore'
import { useHouseholdStore } from '@/store/useHouseholdStore'
import TaskList from '@/components/TaskList'
import CreateRoutineModal from '@/components/CreateRoutineModal'
import InviteModal from '@/components/InviteModal'
import JoinHouseholdModal from '@/components/JoinHouseholdModal'
import { signOut } from 'firebase/auth'
import { auth } from '@/firebase/config'
import { requestNotificationPermission } from '@/firebase/config'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'all' | 'my-tasks'>('today')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user, userData, setUser, loadUserData } = useAuthStore()
  const { 
    tasks, 
    routines, 
    categories, 
    fetchRoutines, 
    fetchCategories, 
    subscribeToTasks,
    checkAndUpdateMissedTasks
  } = useRoutineStore()
  const { household, createHousehold, loadHousehold } = useHouseholdStore()
  const [householdName, setHouseholdName] = useState('')
  const [isCreatingHousehold, setIsCreatingHousehold] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [joinHouseholdId, setJoinHouseholdId] = useState<string | null>(null)

  // Check URL for join parameter
  useEffect(() => {
    const path = window.location.pathname
    const joinMatch = path.match(/\/join\/(.+)/)
    if (joinMatch && joinMatch[1]) {
      const householdId = joinMatch[1]
      setJoinHouseholdId(householdId)
      setIsJoinModalOpen(true)
      // Clean up URL
      window.history.replaceState({}, '', '/')
    }
  }, [])

  useEffect(() => {
    if (userData?.householdId) {
      loadHousehold(userData.householdId)
    }
  }, [userData?.householdId, loadHousehold])

  useEffect(() => {
    if (!userData?.householdId) {
      return
    }

    fetchRoutines(userData.householdId)
    fetchCategories(userData.householdId)
    // Don't filter by user for 'week' and 'today' tabs - show all household tasks
    const shouldFilterByUser = activeTab === 'my-tasks'
    const unsubscribe = subscribeToTasks(userData.householdId, shouldFilterByUser ? user?.uid : undefined)

    // Check for missed tasks periodically
    const interval = setInterval(() => {
      checkAndUpdateMissedTasks()
    }, 60000) // Check every minute

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [userData?.householdId, activeTab, user?.uid, fetchRoutines, fetchCategories, subscribeToTasks, checkAndUpdateMissedTasks])

  useEffect(() => {
    // Request notification permission on mount
    requestNotificationPermission().then(token => {
      if (token) {
        console.log('Notification token:', token)
        // You can save this token to Firestore for sending notifications
      }
    })
  }, [])

  const handleSignOut = async () => {
    try {
      if (!auth) {
        toast.error('Not authenticated')
        return
      }
      await signOut(auth)
      setUser(null)
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleCreateHousehold = async () => {
    if (!householdName.trim() || !user) return
    
    setIsCreatingHousehold(true)
    try {
      await createHousehold(householdName.trim(), user.uid)
      await loadUserData()
      toast.success('Household created!')
      setHouseholdName('')
    } catch (error: any) {
      console.error('Error creating household:', error)
      const errorMessage = error.message || 'Failed to create household'
      toast.error(errorMessage)
      
      // Show helpful message if Firestore not created
      if (errorMessage.includes('Permission denied') || 
          errorMessage.includes('not found') || 
          errorMessage.includes('not initialized')) {
        toast.error('Please create Firestore database in Firebase Console first!', {
          duration: 5000
        })
      }
    } finally {
      setIsCreatingHousehold(false)
    }
  }

  // Show household setup screen if user doesn't have a household
  // Show it even if userData is still loading (user is authenticated)
  if (user && !userData?.householdId) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <div className="text-center mb-8">
              <Home className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome!</h2>
              <p className="text-gray-600">Set up your household to get started</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Household Name
                </label>
                <input
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateHousehold()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., The Smiths"
                  autoFocus={!isJoinModalOpen}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleCreateHousehold}
                  disabled={!householdName.trim() || isCreatingHousehold}
                  className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingHousehold ? 'Creating...' : 'Create Household'}
                </button>
                <button
                  onClick={() => {
                    if (!user) {
                      toast.error('Please sign in first')
                      return
                    }
                    console.log('Opening join modal')
                    setIsJoinModalOpen(true)
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Join Existing
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Render join modal even on welcome screen */}
        <JoinHouseholdModal
          isOpen={isJoinModalOpen}
          onClose={() => {
            setIsJoinModalOpen(false)
            setJoinHouseholdId(null)
          }}
          onSuccess={async () => {
            console.log('Join success callback - reloading user data')
            await loadUserData()
            toast.success('Redirecting to dashboard...')
            setJoinHouseholdId(null)
          }}
          initialHouseholdId={joinHouseholdId}
        />
      </>
    )
  }

  const tabs = [
    { id: 'today' as const, label: 'Today', icon: Calendar },
    { id: 'week' as const, label: 'This Week', icon: Calendar },
    { id: 'my-tasks' as const, label: 'My Tasks', icon: User },
    { id: 'all' as const, label: 'All', icon: CheckSquare }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-primary-700">Routine Manager</h1>
            <div className="flex items-center gap-4">
              {userData?.householdId && (
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  title="Invite to household"
                >
                  <Users className="w-4 h-4" />
                  Invite
                </button>
              )}
              <button
                onClick={() => requestNotificationPermission().then(() => toast.success('Notifications enabled!'))}
                className="p-2 text-gray-600 hover:text-gray-800"
                title="Enable notifications"
              >
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                {userData?.photoURL && (
                  <img 
                    src={userData.photoURL} 
                    alt={userData.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-gray-700">{userData?.displayName || 'User'}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TaskList
          tasks={tasks}
          routines={routines}
          categories={categories}
          users={[]} // TODO: Fetch users from household
          filter={activeTab}
          currentUserId={user?.uid}
        />
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50"
      >
        <Plus className="w-6 h-6" />
      </button>

      {userData?.householdId && (
        <CreateRoutineModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          householdId={userData.householdId}
        />
      )}

      {household && (
        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          householdId={household.id}
          householdName={household.name}
        />
      )}

      <JoinHouseholdModal
        isOpen={isJoinModalOpen}
        onClose={() => {
          setIsJoinModalOpen(false)
          setJoinHouseholdId(null)
        }}
        onSuccess={async () => {
          // Reload user data after joining
          console.log('Join success callback - reloading user data')
          await loadUserData()
          // The useEffect will automatically reload household data
          toast.success('Redirecting to dashboard...')
          setJoinHouseholdId(null)
        }}
        initialHouseholdId={joinHouseholdId}
      />
    </div>
  )
}

