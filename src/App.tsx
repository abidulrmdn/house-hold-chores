import { useEffect, useState } from 'react'
import { onAuthStateChanged, reload, getRedirectResult } from 'firebase/auth'
import { auth, isConfigured } from '@/firebase/config'
import { useAuthStore } from '@/store/useAuthStore'
import { useThemeStore } from '@/store/useThemeStore'
import { useLanguageStore } from '@/store/useLanguageStore'
import Auth from '@/components/Auth'
import Dashboard from '@/pages/Dashboard'
import EmailVerificationScreen from '@/components/EmailVerificationScreen'
import EmailVerificationHandler from '@/components/EmailVerificationHandler'
import { Toaster } from 'react-hot-toast'
import { App as CapacitorApp } from '@capacitor/app'
import { isNativeApp } from '@/utils/device'

function App() {
  const { user, loading, setUser, setLoading, loadUserData } = useAuthStore()
  const { effectiveTheme } = useThemeStore()
  const { direction } = useLanguageStore()
  const [emailVerified, setEmailVerified] = useState(true)
  
  // Check for email verification action in URL
  const [emailAction, setEmailAction] = useState<{ mode: string; oobCode: string; continueUrl?: string } | null>(null)
  
  useEffect(() => {
    // Check URL for email action parameters
    // Firebase can pass these as query params or hash fragments
    const urlParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    
    const mode = urlParams.get('mode') || hashParams.get('mode')
    const oobCode = urlParams.get('oobCode') || hashParams.get('oobCode')
    const continueUrl = urlParams.get('continueUrl') || hashParams.get('continueUrl')
    
    if (mode && oobCode) {
      setEmailAction({
        mode,
        oobCode,
        continueUrl: continueUrl || undefined
      })
      // Clean URL but keep the pathname
      const cleanUrl = window.location.pathname
      window.history.replaceState({}, '', cleanUrl)
    }
  }, [])
  
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

    // Handle Google Sign-In redirect for native apps
    let appUrlListener: any = null
    let appStateListener: any = null
    
    if (isNativeApp() && auth) {
      // Function to handle redirect result
      const handleRedirectResult = async () => {
        if (!auth) return
        try {
          const result = await getRedirectResult(auth)
          if (result) {
            console.log('App.tsx: Google Sign-In redirect successful:', result.user.email)
            // The auth state change listener will handle the rest
          }
        } catch (error: any) {
          // Ignore common non-error cases
          if (error.code !== 'auth/popup-closed-by-user' && 
              error.code !== 'auth/cancelled-popup-request' &&
              !error.message?.includes('no pending')) {
            console.error('App.tsx: Error handling redirect result:', error)
          }
        }
      }
      
      // Check for redirect result on initial load
      handleRedirectResult()
      
      // Listen for app URL events (deep links from Firebase Auth)
      appUrlListener = CapacitorApp.addListener('appUrlOpen', async (event: any) => {
        console.log('App.tsx: App opened with URL:', event.url)
        
        // Check if this is a Firebase Auth redirect
        if (event.url.includes('__/auth/handler') || 
            event.url.includes('firebaseapp.com') ||
            event.url.includes('web.app')) {
          console.log('App.tsx: Firebase Auth redirect detected, processing immediately')
          // Process immediately to prevent localhost redirect
          await handleRedirectResult()
        }
        
        // Also catch localhost redirect attempts (shouldn't happen, but just in case)
        if (event.url.includes('localhost') || event.url.includes('127.0.0.1')) {
          console.warn('App.tsx: Localhost redirect detected, processing auth result')
          await handleRedirectResult()
        }
      })
      
      // Listen for app state changes (when app comes to foreground)
      appStateListener = CapacitorApp.addListener('appStateChange', async (state: any) => {
        if (state.isActive) {
          console.log('App.tsx: App became active, checking for redirect result')
          // Check for redirect result when app becomes active
          setTimeout(() => {
            handleRedirectResult()
          }, 500)
        }
      })
    }

    if (!auth) {
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
            // Only reload if email is not verified (to avoid unnecessary reloads)
            if (!firebaseUser.emailVerified) {
              await reload(firebaseUser)
              // Wait a moment for the reload to complete
              await new Promise(resolve => setTimeout(resolve, 300))
            }
            
            // Get fresh user reference after reload
            const currentUser = auth?.currentUser
            if (!currentUser) {
              setLoading(false)
              return
            }
            
            // Check if we're in local/test environment - only in development mode
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            const isDev = import.meta.env.DEV && import.meta.env.MODE === 'development'
            const showDebugOption = isLocalhost && isDev && import.meta.env.PROD === false
            
            // In local/test, check for local verification flag
            if (showDebugOption && localStorage.getItem(`email-verified-local-${currentUser.uid}`) === 'true') {
              setEmailVerified(true)
            } else {
              setEmailVerified(currentUser.emailVerified)
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

      return () => {
        unsubscribe()
        if (appUrlListener) {
          appUrlListener.remove()
        }
        if (appStateListener) {
          appStateListener.remove()
        }
      }
    } catch (error) {
      console.error('Error setting up auth listener:', error)
      setLoading(false)
      // Clean up listeners on error
      if (appUrlListener) {
        appUrlListener.remove()
      }
      if (appStateListener) {
        appStateListener.remove()
      }
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
        // Reload user to get latest verification status
        await reload(auth.currentUser)
        
        // Wait a moment for auth state to update
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Get fresh user reference
        const currentUser = auth.currentUser
        if (!currentUser) {
          console.error('User not found after reload')
          return
        }
        
        // Check if we're in local/test environment
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development'
        
        // In local/test, check for local verification flag
        if ((isLocalhost || isDev) && localStorage.getItem(`email-verified-local-${currentUser.uid}`) === 'true') {
          setEmailVerified(true)
        } else {
          setEmailVerified(currentUser.emailVerified)
        }
        
        // If verified, trigger auth state change to reload user data
        if (currentUser.emailVerified || ((isLocalhost || isDev) && localStorage.getItem(`email-verified-local-${currentUser.uid}`) === 'true')) {
          // The onAuthStateChanged listener should handle the rest
          // Force a re-check by setting user again
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Error reloading user after verification:', error)
        // Fallback: check local verification flag in local/test
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development'
        if ((isLocalhost || isDev) && localStorage.getItem(`email-verified-local-${auth.currentUser?.uid}`) === 'true') {
          setEmailVerified(true)
        }
      }
    }
  }

  // Check if user should be blocked
  // Block all unverified email/password users (both production and local)
  // Google users are auto-verified, so they bypass
  const shouldBlockAccess = user && !emailVerified && user.providerData[0]?.providerId !== 'google.com'

  // Handle email verification action
  if (emailAction) {
    return (
      <>
        <Toaster position="top-center" />
        <EmailVerificationHandler
          mode={emailAction.mode}
          oobCode={emailAction.oobCode}
          continueUrl={emailAction.continueUrl}
        />
      </>
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

