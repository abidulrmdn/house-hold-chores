import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, isConfigured } from '@/firebase/config'
import { useAuthStore } from '@/store/useAuthStore'
import { useThemeStore } from '@/store/useThemeStore'
import Auth from '@/components/Auth'
import Dashboard from '@/pages/Dashboard'
import { Toaster } from 'react-hot-toast'

function App() {
  const { user, loading, setUser, setLoading, loadUserData } = useAuthStore()
  const { effectiveTheme } = useThemeStore()
  
  // Apply dark mode class to document
  useEffect(() => {
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [effectiveTheme])

  useEffect(() => {
    if (!isConfigured || !auth) {
      // If Firebase isn't configured, show auth page but with a message
      setLoading(false)
      return
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser)
        if (firebaseUser) {
          await loadUserData()
        }
        setLoading(false)
      }, (error) => {
        console.error('Auth state change error:', error)
        setLoading(false)
      })

      return unsubscribe
    } catch (error) {
      console.error('Error setting up auth listener:', error)
      setLoading(false)
    }
  }, [setUser, setLoading, loadUserData, isConfigured, auth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-center" />
      {!isConfigured && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg z-50">
          <p className="text-sm">
            ⚠️ Firebase not configured. Please set up your .env file. See README.md for instructions.
          </p>
        </div>
      )}
      {user ? <Dashboard /> : <Auth />}
    </>
  )
}

export default App

