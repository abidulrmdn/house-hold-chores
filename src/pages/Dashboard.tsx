import { useState, useEffect } from 'react'
import { Plus, Calendar, CheckSquare, User, Bell, Home, Users, Settings, LogOut, Tag } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useRoutineStore } from '@/store/useRoutineStore'
import { useHouseholdStore } from '@/store/useHouseholdStore'
import TaskList from '@/components/TaskList'
import CreateRoutineModal from '@/components/CreateRoutineModal'
import InviteModal from '@/components/InviteModal'
import JoinHouseholdModal from '@/components/JoinHouseholdModal'
import ManageCategoriesModal from '@/components/ManageCategoriesModal'
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
  const { household, createHousehold, loadHousehold, leaveHousehold } = useHouseholdStore()
  const [householdName, setHouseholdName] = useState('')
  const [isCreatingHousehold, setIsCreatingHousehold] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [joinHouseholdId, setJoinHouseholdId] = useState<string | null>(null)
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [householdUsers, setHouseholdUsers] = useState<any[]>([])
  const [userFilter, setUserFilter] = useState<string | null>(null)

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
      fetchHouseholdUsers(userData.householdId)
    }
  }, [userData?.householdId, loadHousehold])

  const fetchHouseholdUsers = async (householdId: string) => {
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore')
      const { db } = await import('@/firebase/config')
      if (!db) return

      const usersQuery = query(
        collection(db, 'users'),
        where('householdId', '==', householdId)
      )
      const usersSnapshot = await getDocs(usersQuery)
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setHouseholdUsers(users)
    } catch (error: any) {
      // If permission error, try to get users from household object instead
      if (error?.code === 'permission-denied' && household?.members) {
        try {
          const { doc, getDoc } = await import('firebase/firestore')
          const { db } = await import('@/firebase/config')
          if (!db) return
          
          const memberPromises = household.members.map(async (memberId: string) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', memberId))
              if (userDoc.exists()) {
                return { id: userDoc.id, ...userDoc.data() }
              }
              return null
            } catch {
              return null
            }
          })
          const members = (await Promise.all(memberPromises)).filter(Boolean)
          if (members.length > 0) {
            setHouseholdUsers(members)
          }
        } catch (fallbackError) {
          console.error('Error fetching household users from members:', fallbackError)
        }
      } else {
        console.error('Error fetching household users:', error)
      }
    }
  }

  useEffect(() => {
    if (!userData?.householdId) {
      return
    }

    fetchRoutines(userData.householdId)
    fetchCategories(userData.householdId)
    // Always fetch all household tasks, filtering will be done in TaskList
    const unsubscribe = subscribeToTasks(userData.householdId)

    // Check for missed tasks periodically
    const interval = setInterval(() => {
      checkAndUpdateMissedTasks()
    }, 60000) // Check every minute

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [userData?.householdId, activeTab, user?.uid, fetchRoutines, fetchCategories, subscribeToTasks, checkAndUpdateMissedTasks])

  // Clear user filter when switching tabs (except my-tasks)
  useEffect(() => {
    if (activeTab !== 'my-tasks') {
      setUserFilter(null)
    } else if (activeTab === 'my-tasks' && user?.uid) {
      // Auto-filter to current user when on "my-tasks" tab
      setUserFilter(user.uid)
    }
  }, [activeTab, user?.uid])

  useEffect(() => {
    // Request notification permission on mount (fail silently if not configured)
    requestNotificationPermission().then(token => {
      if (token) {
        console.log('Notification token:', token)
        // You can save this token to Firestore for sending notifications
      }
    }).catch(() => {
      // Silently ignore notification errors
    })
  }, [])

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isSettingsOpen && !target.closest('.settings-dropdown')) {
        setIsSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSettingsOpen])

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

  const handleLeaveHousehold = async () => {
    if (!user || !confirm('Are you sure you want to leave this household? You will need to join or create a new one to continue.')) {
      return
    }
    
    try {
      await leaveHousehold(user.uid)
      await loadUserData()
      toast.success('Left household successfully')
      setIsSettingsOpen(false)
    } catch (error: any) {
      console.error('Error leaving household:', error)
      toast.error(error.message || 'Failed to leave household')
    }
  }

  const handleCreateNewHousehold = async () => {
    if (!user) {
      toast.error('Please sign in first')
      return
    }
    
    if (!confirm('Are you sure you want to create a new household? You will leave your current household.')) {
      return
    }
    
    try {
      // Leave current household first
      if (userData?.householdId) {
        await leaveHousehold(user.uid)
      }
      
      // Show create household form
      setIsSettingsOpen(false)
      setHouseholdName('')
      // The welcome screen will show automatically
    } catch (error: any) {
      console.error('Error creating new household:', error)
      toast.error(error.message || 'Failed to create new household')
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
          <div className="flex items-center justify-between min-h-16 py-2 sm:py-0 sm:h-16 gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              {household && (
                <h1 className="text-xl sm:text-2xl font-bold text-primary-700 truncate">{household.name}</h1>
              )}
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Routine Manager</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {userData?.householdId && (
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs sm:text-sm font-medium"
                  title="Invite to household"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Invite</span>
                </button>
              )}
              <button
                onClick={() => {
                  requestNotificationPermission()
                    .then((token) => {
                      if (token) {
                        toast.success('Notifications enabled!')
                      } else {
                        toast.error('Notifications not configured. Please set up VAPID key in Firebase.')
                      }
                    })
                    .catch(() => {
                      toast.error('Failed to enable notifications')
                    })
                }}
                className="p-2 text-gray-600 hover:text-gray-800 flex-shrink-0"
                title="Enable notifications"
              >
                <Bell className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2">
                {userData?.photoURL && (
                  <img 
                    src={userData.photoURL} 
                    alt={userData.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-gray-700">{userData?.displayName || 'User'}</span>
              </div>
              {userData?.photoURL && (
                <img 
                  src={userData.photoURL} 
                  alt={userData.displayName}
                  className="sm:hidden w-8 h-8 rounded-full flex-shrink-0"
                />
              )}
              {userData?.householdId && (
                <div className="relative settings-dropdown flex-shrink-0">
                  <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="p-2 text-gray-600 hover:text-gray-800"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  {isSettingsOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <button
                        onClick={() => {
                          setIsManageCategoriesOpen(true)
                          setIsSettingsOpen(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Tag className="w-4 h-4" />
                        Manage Categories
                      </button>
                      <div className="border-t border-gray-200 my-2"></div>
                      <button
                        onClick={handleLeaveHousehold}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Leave Household
                      </button>
                      <button
                        onClick={handleCreateNewHousehold}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Home className="w-4 h-4" />
                        Create New Household
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="hidden sm:block text-sm text-gray-600 hover:text-gray-800 whitespace-nowrap"
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
        {/* User Filter */}
        {userData?.householdId && householdUsers.length > 1 && (
          <div className="mb-4 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Filter by person:</label>
            <select
              value={userFilter || ''}
              onChange={(e) => setUserFilter(e.target.value || null)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="">All People</option>
              {householdUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.displayName || user.email || user.id} {user.id === userData?.id ? '(You)' : ''}
                </option>
              ))}
            </select>
            {userFilter && (
              <button
                onClick={() => setUserFilter(null)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
            )}
          </div>
        )}
        <TaskList
          tasks={tasks}
          routines={routines}
          categories={categories}
          users={householdUsers}
          filter={activeTab}
          currentUserId={user?.uid}
          userFilter={userFilter}
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

      {userData?.householdId && (
        <ManageCategoriesModal
          isOpen={isManageCategoriesOpen}
          onClose={() => setIsManageCategoriesOpen(false)}
          householdId={userData.householdId}
        />
      )}
    </div>
  )
}

