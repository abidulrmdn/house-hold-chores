import { useEffect, useState } from 'react'
import { onAuthStateChanged, reload } from 'firebase/auth'
import { auth, isConfigured } from '@/firebase/config'
import { useAuthStore } from '@/store/useAuthStore'
import { useThemeStore } from '@/store/useThemeStore'
import { useLanguageStore } from '@/store/useLanguageStore'
import Auth from '@/components/Auth'
import Dashboard from '@/pages/Dashboard'
import EmailVerificationScreen from '@/components/EmailVerificationScreen'
import { Toaster } from 'react-hot-toast'

function App() {
  const { user, loading, setUser, setLoading, loadUserData } = useAuthStore()
  const { effectiveTheme } = useThemeStore()
  const { direction } = useLanguageStore()
  const [emailVerified, setEmailVerified] = useState(true)
  
  // Apply dark mode class to document
  useEffect(() => {
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [effectiveTheme])

  // Apply text direction based on language
  useEffect(() => {
    document.documentElement.dir = direction
  }, [direction])

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
          // Check email verification status
          // Reload user to get latest verification status
          try {
            await reload(firebaseUser)
            
            // Check if we're in local/test environment
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development'
            
            // In local/test, check for local verification flag
            if ((isLocalhost || isDev) && localStorage.getItem(`email-verified-local-${firebaseUser.uid}`) === 'true') {
              setEmailVerified(true)
            } else {
              setEmailVerified(firebaseUser.emailVerified)
            }
          } catch (error) {
            console.error('Error reloading user:', error)
            // Fallback: check local verification flag in local/test
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development'
            if ((isLocalhost || isDev) && localStorage.getItem(`email-verified-local-${firebaseUser.uid}`) === 'true') {
              setEmailVerified(true)
            } else {
              setEmailVerified(firebaseUser.emailVerified)
            }
          }
          await loadUserData()
        } else {
          setEmailVerified(true)
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

  const handleEmailVerified = async () => {
    if (auth?.currentUser) {
      try {
        await reload(auth.currentUser)
        
        // Check if we're in local/test environment
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development'
        
        // In local/test, check for local verification flag
        if ((isLocalhost || isDev) && localStorage.getItem(`email-verified-local-${auth.currentUser.uid}`) === 'true') {
          setEmailVerified(true)
        } else {
          setEmailVerified(auth.currentUser.emailVerified)
        }
      } catch (error) {
        console.error('Error reloading user after verification:', error)
        // Fallback: check local verification flag in local/test
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development'
        if ((isLocalhost || isDev) && localStorage.getItem(`email-verified-local-${auth.currentUser.uid}`) === 'true') {
          setEmailVerified(true)
        }
      }
    }
  }

  // Check if user should be blocked
  // Block all unverified email/password users (both production and local)
  // Google users are auto-verified, so they bypass
  const shouldBlockAccess = user && !emailVerified && user.providerData[0]?.providerId !== 'google.com'

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
      {user ? (
        shouldBlockAccess ? (
          <EmailVerificationScreen user={user} onVerified={handleEmailVerified} />
        ) : (
          <Dashboard />
        )
      ) : (
        <Auth />
      )}
    </>
  )
}

export default App

