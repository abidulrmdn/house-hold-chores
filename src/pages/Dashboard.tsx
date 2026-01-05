import { useState, useEffect, useMemo } from 'react'
import { Plus, Calendar, CheckSquare, User, Bell, Home, Users, Settings, LogOut, Tag, Search, Moon, Sun, ArrowUpDown, X, CheckCircle2, BarChart3, Info } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useRoutineStore } from '@/store/useRoutineStore'
import { useHouseholdStore } from '@/store/useHouseholdStore'
import { useThemeStore } from '@/store/useThemeStore'
import TaskList from '@/components/TaskList'
import CreateRoutineModal from '@/components/CreateRoutineModal'
import InviteModal from '@/components/InviteModal'
import JoinHouseholdModal from '@/components/JoinHouseholdModal'
import ManageCategoriesModal from '@/components/ManageCategoriesModal'
import UserProfileModal from '@/components/UserProfileModal'
import DayTasksModal from '@/components/DayTasksModal'
import InstallPrompt from '@/components/InstallPrompt'
import Tutorial from '@/components/Tutorial'
import StatisticsDashboard from '@/components/StatisticsDashboard'
import CalendarView from '@/components/CalendarView'
import AISuggestions from '@/components/AISuggestions'
import SmartInsights from '@/components/SmartInsights'
import { signOut } from 'firebase/auth'
import { auth } from '@/firebase/config'
import { requestNotificationPermission, sendTestNotification, scheduleDelayedNotification } from '@/firebase/config'
import { sendDailyNotification, scheduleDailyNotificationCheck } from '@/services/notificationService'
import toast from 'react-hot-toast'
import { isToday, startOfWeek, endOfWeek } from 'date-fns'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'all' | 'my-tasks' | 'stats' | 'calendar'>('today')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user, userData, setUser, loadUserData } = useAuthStore()
  const { 
    tasks, 
    routines, 
    categories, 
    fetchRoutines, 
    fetchCategories, 
    subscribeToTasks,
    checkAndUpdateMissedTasks,
    completeTask
  } = useRoutineStore()
  const { household, createHousehold, loadHousehold, leaveHousehold } = useHouseholdStore()
  const [householdName, setHouseholdName] = useState('')
  const [isCreatingHousehold, setIsCreatingHousehold] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [joinHouseholdId, setJoinHouseholdId] = useState<string | null>(null)
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false)
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false)
  const [isDayTasksModalOpen, setIsDayTasksModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [householdUsers, setHouseholdUsers] = useState<any[]>([])
  const [userFilter, setUserFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'dueDate' | 'assignee'>('dueDate')
  const [quickFilter, setQuickFilter] = useState<'overdue' | 'today' | 'upcoming' | 'avoiding' | 'quick' | null>(null)
  const [showQuickTasksInfo, setShowQuickTasksInfo] = useState(false)
  const [pendingSuggestion, setPendingSuggestion] = useState<any>(null)
  const [notificationStatus, setNotificationStatus] = useState<'enabled' | 'disabled' | 'unknown'>('unknown')
  const { theme, setTheme, effectiveTheme } = useThemeStore()

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
    // Check notification status on mount and save token to Firestore
    const checkNotificationStatus = async () => {
      try {
        if (Notification.permission === 'granted') {
          const token = await requestNotificationPermission()
          if (token && user?.uid) {
            setNotificationStatus('enabled')
            // Save token to Firestore for Cloud Functions to use
            try {
              const { doc: docFn, updateDoc: updateDocFn } = await import('firebase/firestore')
              const { db } = await import('@/firebase/config')
              if (db) {
                await updateDocFn(docFn(db, 'users', user.uid), {
                  fcmToken: token,
                  notificationEnabled: true
                })
              }
            } catch (error) {
              console.error('Error saving FCM token to Firestore:', error)
            }
          } else {
            setNotificationStatus('disabled')
          }
        } else {
          setNotificationStatus('disabled')
        }
      } catch {
        setNotificationStatus('disabled')
      }
    }
    checkNotificationStatus()
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
            <div className="text-center mb-8">
              <Home className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Welcome!</h2>
              <p className="text-gray-600 dark:text-gray-400">Set up your household to get started</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Household Name
                </label>
                <input
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateHousehold()}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

  // Calculate task counts for badges
  const taskCounts = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    
    return {
      today: tasks.filter(t => isToday(new Date(t.dueDate)) && !t.isCompleted).length,
      week: tasks.filter(t => {
        const taskDate = new Date(t.dueDate)
        return taskDate >= weekStart && taskDate <= weekEnd
      }).length,
      'my-tasks': tasks.filter(t => t.assignedTo === user?.uid).length,
      all: tasks.length
    }
  }, [tasks, user?.uid])

  // Schedule daily notification check
  useEffect(() => {
    if (notificationStatus === 'enabled' && userData?.householdId && user?.uid) {
      scheduleDailyNotificationCheck(async () => {
        // Get actual today's task count for current user
        const todayTasks = tasks.filter(t => 
          isToday(new Date(t.dueDate)) && 
          !t.isCompleted &&
          t.assignedTo === user.uid
        )
        const count = todayTasks.length
        
        if (count > 0) {
          try {
            await sendDailyNotification(count)
          } catch (error) {
            console.error('Failed to send daily notification:', error)
          }
        }
      })
    }
  }, [notificationStatus, userData?.householdId, tasks, user?.uid])

  const tabs = [
    { id: 'today' as const, label: 'Today', icon: Calendar, count: taskCounts.today },
    { id: 'week' as const, label: 'This Week', icon: Calendar, count: taskCounts.week },
    { id: 'my-tasks' as const, label: 'My Tasks', icon: User, count: taskCounts['my-tasks'] },
    { id: 'all' as const, label: 'All', icon: CheckSquare, count: taskCounts.all },
    { id: 'calendar' as const, label: 'Calendar', icon: Calendar, count: undefined },
    { id: 'stats' as const, label: 'Statistics', icon: BarChart3, count: undefined }
  ]

  // Clear quick filter when switching tabs
  useEffect(() => {
    setQuickFilter(null)
  }, [activeTab])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Escape key - close modals
      if (e.key === 'Escape') {
        if (isModalOpen) {
          setIsModalOpen(false)
          setPendingSuggestion(null)
        }
        if (isInviteModalOpen) {
          setIsInviteModalOpen(false)
        }
        if (isJoinModalOpen) {
          setIsJoinModalOpen(false)
        }
        if (isManageCategoriesOpen) {
          setIsManageCategoriesOpen(false)
        }
        if (isUserProfileOpen) {
          setIsUserProfileOpen(false)
        }
        if (isDayTasksModalOpen) {
          setIsDayTasksModalOpen(false)
          setSelectedDate(null)
        }
        if (isSettingsOpen) {
          setIsSettingsOpen(false)
        }
        return
      }

      // Don't trigger shortcuts when typing in inputs
      if ((e.target as HTMLElement).tagName === 'INPUT' || 
          (e.target as HTMLElement).tagName === 'TEXTAREA' ||
          (e.target as HTMLElement).isContentEditable) {
        return
      }

      // Ctrl/Cmd + key combinations
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'k':
            e.preventDefault()
            // Focus search
            const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement
            searchInput?.focus()
            break
        }
        return
      }

      // Single key shortcuts
      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault()
          setIsModalOpen(true)
          break
        case 's':
          e.preventDefault()
          // Focus search
          const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement
          searchInput?.focus()
          break
        case 't':
          e.preventDefault()
          setActiveTab('today')
          break
        case 'w':
          e.preventDefault()
          setActiveTab('week')
          break
        case 'a':
          e.preventDefault()
          setActiveTab('all')
          break
        case 'm':
          e.preventDefault()
          setActiveTab('my-tasks')
          break
        case 'c':
          e.preventDefault()
          setActiveTab('calendar')
          break
        case '?':
          e.preventDefault()
          toast('Keyboard Shortcuts:\nN - New routine\nS - Search\nT - Today\nW - Week\nA - All\nM - My Tasks\nC - Calendar\nEsc - Close modals\nCtrl+K - Quick search', {
            duration: 5000,
            icon: '⌨️'
          })
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isModalOpen, isInviteModalOpen, isJoinModalOpen, isManageCategoriesOpen, isUserProfileOpen, isDayTasksModalOpen, isSettingsOpen])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-16 py-2 sm:py-0 sm:h-16 gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              {household && (
                <h1 className="text-xl sm:text-2xl font-bold text-primary-700 dark:text-primary-400 truncate">{household.name}</h1>
              )}
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Routine Manager</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => {
                  const newTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'
                  setTheme(newTheme)
                }}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 flex-shrink-0"
                title={`Theme: ${theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'}`}
              >
                {effectiveTheme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
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
              <div className="relative group">
                <button
                  onClick={async () => {
                    try {
                      // Check if VAPID key is configured (for debugging)
                      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
                      console.log('VAPID Key check:', {
                        exists: !!vapidKey,
                        length: vapidKey?.length || 0,
                        startsWith: vapidKey?.substring(0, 10) || 'none'
                      })
                      
                      // First try to enable push notifications (requires VAPID key)
                      const token = await requestNotificationPermission()
                      if (token && user?.uid) {
                        setNotificationStatus('enabled')
                        // Save token to Firestore for Cloud Functions
                        try {
                          const { doc: docFn, updateDoc: updateDocFn } = await import('firebase/firestore')
                          const { db } = await import('@/firebase/config')
                          if (db) {
                            await updateDocFn(docFn(db, 'users', user.uid), {
                              fcmToken: token,
                              notificationEnabled: true
                            })
                          }
                        } catch (error) {
                          console.error('Error saving FCM token:', error)
                        }
                        toast.success('Push notifications enabled! You\'ll receive daily notifications at 8 AM.')
                        console.log('FCM Token:', token) // Log token for debugging
                      } else {
                        // Check if VAPID key is configured
                        if (!vapidKey || vapidKey === 'demo-vapid-key' || vapidKey.trim() === '') {
                          setNotificationStatus('disabled')
                          toast('VAPID key not configured. Please add VITE_FIREBASE_VAPID_KEY to your .env file and restart the dev server.', { icon: 'ℹ️' })
                        } else {
                          // VAPID key is set but token request failed
                          if (Notification.permission === 'granted') {
                            setNotificationStatus('disabled')
                            toast('Browser notifications enabled, but push notifications failed. Check VAPID key.', { icon: '⚠️' })
                          } else if (Notification.permission === 'default') {
                            const permission = await Notification.requestPermission()
                            if (permission === 'granted') {
                              // Retry getting token after permission granted
                              const retryToken = await requestNotificationPermission()
                              if (retryToken) {
                                setNotificationStatus('enabled')
                                toast.success('Push notifications enabled!')
                              } else {
                                setNotificationStatus('disabled')
                                toast('Browser notifications enabled, but push notifications failed. Check VAPID key.', { icon: '⚠️' })
                              }
                            } else {
                              setNotificationStatus('disabled')
                              toast.error('Notification permission denied')
                            }
                          } else {
                            setNotificationStatus('disabled')
                            toast.error('Notifications blocked. Please enable in browser settings.')
                          }
                        }
                      }
                    } catch (error: any) {
                      console.error('Notification error:', error)
                      setNotificationStatus('disabled')
                      toast.error(`Failed to enable notifications: ${error.message}`)
                    }
                  }}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 flex-shrink-0 relative"
                  title={notificationStatus === 'enabled' ? 'Notifications enabled' : 'Enable notifications'}
                >
                  <Bell className="w-5 h-5" />
                  {notificationStatus === 'enabled' && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                  )}
                  {notificationStatus === 'disabled' && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-gray-400 rounded-full border-2 border-white dark:border-gray-800"></span>
                  )}
                </button>
                {import.meta.env.DEV && (
                  <div className="absolute right-0 top-full mt-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 min-w-[200px]">
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 px-2">Test Notifications</div>
                    <button
                      onClick={async () => {
                        try {
                          await sendTestNotification()
                          toast.success('Browser notification sent!')
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to send test notification')
                        }
                      }}
                      className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 whitespace-nowrap text-left w-full"
                      title="Send immediate browser notification"
                    >
                      Browser Notification
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await scheduleDelayedNotification(10)
                          toast.success('Delayed notification scheduled for 10 seconds!')
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to schedule delayed notification')
                        }
                      }}
                      className="px-3 py-1.5 bg-green-500 text-white text-xs rounded hover:bg-green-600 whitespace-nowrap text-left w-full"
                      title="Schedule notification for 10 seconds (works when browser is closed)"
                    >
                      Delayed (10s)
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <button
                      onClick={async () => {
                        try {
                          if (notificationStatus !== 'enabled') {
                            toast.error('Please enable notifications first!')
                            return
                          }
                          const { httpsCallable } = await import('firebase/functions')
                          const { functions } = await import('@/firebase/config')
                          if (!functions) throw new Error('Functions not initialized')
                          
                          const testNotification = httpsCallable(functions, 'testPushNotification')
                          const result = await testNotification({ taskCount: 1 })
                          toast.success((result.data as any).message || 'Push notification sent!')
                        } catch (error: any) {
                          toast.error(`Failed: ${error.message || 'Unknown error'}`)
                        }
                      }}
                      className="px-3 py-1.5 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 whitespace-nowrap text-left w-full"
                      title="Test FCM push notification via Cloud Function (1 task)"
                    >
                      🧪 Test Push (1 task)
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          if (notificationStatus !== 'enabled') {
                            toast.error('Please enable notifications first!')
                            return
                          }
                          const { httpsCallable } = await import('firebase/functions')
                          const { functions } = await import('@/firebase/config')
                          if (!functions) throw new Error('Functions not initialized')
                          
                          const testNotification = httpsCallable(functions, 'testPushNotification')
                          const result = await testNotification({ taskCount: 5 })
                          toast.success((result.data as any).message || 'Push notification sent!')
                        } catch (error: any) {
                          toast.error(`Failed: ${error.message || 'Unknown error'}`)
                        }
                      }}
                      className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 whitespace-nowrap text-left w-full"
                      title="Test FCM push notification via Cloud Function (5 tasks)"
                    >
                      🧪 Test Push (5 tasks)
                    </button>
                  </div>
                )}
              </div>
              <div className="hidden sm:flex items-center gap-2">
                {userData?.photoURL && (
                  <img 
                    src={userData.photoURL} 
                    alt={userData.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{userData?.displayName || 'User'}</span>
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
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                    title="Settings"
                    data-tutorial="settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  {isSettingsOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                      <button
                        onClick={() => {
                          setIsUserProfileOpen(true)
                          setIsSettingsOpen(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        Profile Settings
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                      <button
                        onClick={() => {
                          setIsManageCategoriesOpen(true)
                          setIsSettingsOpen(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Tag className="w-4 h-4" />
                        Manage Categories
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                      <button
                        onClick={handleLeaveHousehold}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Leave Household
                      </button>
                      <button
                        onClick={handleCreateNewHousehold}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
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
                className="hidden sm:block text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 whitespace-nowrap"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-30" data-tutorial="search">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'assignee')}
                className="px-4 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="dueDate">Sort by Due Date</option>
                <option value="assignee">Sort by Assignee</option>
              </select>
              <ArrowUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setQuickFilter(quickFilter === 'overdue' ? null : 'overdue')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                quickFilter === 'overdue'
                  ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Overdue
            </button>
            <button
              onClick={() => setQuickFilter(quickFilter === 'today' ? null : 'today')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                quickFilter === 'today'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setQuickFilter(quickFilter === 'upcoming' ? null : 'upcoming')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                quickFilter === 'upcoming'
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setQuickFilter(quickFilter === 'avoiding' ? null : 'avoiding')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                quickFilter === 'avoiding'
                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Tasks you've been avoiding (missed 2+ times)"
            >
              Avoiding
            </button>
            <div className="relative flex items-center gap-1">
              <button
                onClick={() => setQuickFilter(quickFilter === 'quick' ? null : 'quick')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  quickFilter === 'quick'
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Quick tasks (15 minutes or less)"
              >
                Quick Tasks
              </button>
              <button
                onMouseEnter={() => setShowQuickTasksInfo(true)}
                onMouseLeave={() => setShowQuickTasksInfo(false)}
                onFocus={() => setShowQuickTasksInfo(true)}
                onBlur={() => setShowQuickTasksInfo(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5"
                aria-label="Info about Quick Tasks filter"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              {showQuickTasksInfo && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50 text-xs">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Quick Tasks Filter
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 space-y-1">
                    <p>Shows tasks that can be completed in 15 minutes or less.</p>
                    <p className="mt-2 font-medium">Includes:</p>
                    <ul className="list-disc list-inside ml-2 space-y-0.5">
                      <li>Tasks with estimated duration ≤ 15 minutes</li>
                      <li>Tasks without an estimated duration set</li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                      💡 Tip: Set estimated duration when creating routines to use this filter effectively.
                    </p>
                  </div>
                </div>
              )}
            </div>
            {quickFilter && (
              <button
                onClick={() => setQuickFilter(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-[140px] sm:top-[120px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto" data-tutorial="tabs">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors relative ${
                    activeTab === tab.id
                      ? 'border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Smart Insights */}
        {userData?.householdId && tasks.length > 0 && (
          <SmartInsights
            tasks={tasks}
            routines={routines}
            categories={categories}
          />
        )}

        {/* AI Suggestions */}
        {userData?.householdId && activeTab !== 'stats' && activeTab !== 'calendar' && (
          <AISuggestions
            routines={routines}
            categories={categories}
            tasks={tasks}
            householdId={userData.householdId}
            onSuggestionSelect={(suggestion) => {
              // Open create routine modal with suggestion pre-filled
              setIsModalOpen(true)
              // Store suggestion to pre-fill form
              setPendingSuggestion(suggestion)
            }}
          />
        )}

        {/* Clear All Today Button */}
        {activeTab === 'today' && userData?.householdId && user && (() => {
          const todayTasks = tasks.filter(t => 
            isToday(new Date(t.dueDate)) && !t.isCompleted && t.assignedTo === user.uid
          )
          const incompleteCount = todayTasks.length
          
          if (incompleteCount === 0) return null
          
          return (
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (!user) {
                      toast.error('Please sign in to complete tasks')
                      return
                    }
                    
                    if (window.confirm(`Mark all ${incompleteCount} incomplete task${incompleteCount > 1 ? 's' : ''} assigned to you as complete?`)) {
                      try {
                        const promises = todayTasks.map(task => 
                          completeTask(task.id, user.uid).catch(err => {
                            console.error(`Error completing task ${task.id}:`, err)
                            return null
                          })
                        )
                        await Promise.all(promises)
                        toast.success(`Completed ${incompleteCount} task${incompleteCount > 1 ? 's' : ''}!`)
                      } catch (error: any) {
                        console.error('Error completing tasks:', error)
                        toast.error('Failed to complete some tasks')
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors dark:bg-green-500 dark:hover:bg-green-600"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Clear My Today ({incompleteCount})
                </button>
              </div>
            </div>
          )
        })()}
        
        {/* User Filter */}
        {userData?.householdId && householdUsers.length > 1 && (
          <div className="mb-4 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by person:</label>
            <select
              value={userFilter || ''}
              onChange={(e) => setUserFilter(e.target.value || null)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
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
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Clear
              </button>
            )}
          </div>
        )}
        {activeTab === 'stats' ? (
          <StatisticsDashboard
            tasks={tasks}
            routines={routines}
            users={householdUsers}
            currentUserId={user?.uid}
          />
        ) : activeTab === 'calendar' ? (
          <CalendarView
            tasks={tasks}
            routines={routines}
            categories={categories}
            users={householdUsers}
            onTaskClick={(task) => {
              // Could open task edit modal here
              console.log('Task clicked:', task)
            }}
            onDayClick={(date) => {
              setSelectedDate(date)
              setIsDayTasksModalOpen(true)
            }}
          />
        ) : (
          <TaskList
            tasks={tasks}
            routines={routines}
            categories={categories}
            users={householdUsers}
            filter={activeTab}
            currentUserId={user?.uid}
            userFilter={userFilter}
            searchQuery={searchQuery}
            sortBy={sortBy}
            quickFilter={quickFilter}
          />
        )}
      </main>

      {userData?.householdId && (
        <CreateRoutineModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setPendingSuggestion(null)
          }}
          householdId={userData.householdId}
          initialSuggestion={pendingSuggestion}
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

      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
      />

      <DayTasksModal
        isOpen={isDayTasksModalOpen}
        onClose={() => {
          setIsDayTasksModalOpen(false)
          setSelectedDate(null)
        }}
        date={selectedDate}
        tasks={tasks}
        routines={routines}
        categories={categories}
        users={householdUsers}
      />

      {/* Floating Action Button for Quick Add */}
      {userData?.householdId && activeTab !== 'stats' && activeTab !== 'calendar' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all z-40 flex items-center justify-center group"
          title="Create new routine (N)"
          data-tutorial="create-button"
        >
          <Plus className="w-6 h-6" />
          <span className="ml-2 hidden sm:inline font-medium">New Routine</span>
        </button>
      )}

      {/* Install Prompt */}
      <InstallPrompt />

      {/* Tutorial */}
      <Tutorial />
    </div>
  )
}

