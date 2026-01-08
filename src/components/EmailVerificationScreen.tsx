import { useState, useEffect } from 'react'
import { sendEmailVerification, reload } from 'firebase/auth'
import { auth } from '@/firebase/config'
import { Mail, AlertCircle, CheckCircle2, RefreshCw, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

interface EmailVerificationScreenProps {
  user: any
  onVerified?: () => void
}

export default function EmailVerificationScreen({ user, onVerified }: EmailVerificationScreenProps) {
  const [isSending, setIsSending] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  // Auto-check verification status periodically
  useEffect(() => {
    if (!auth?.currentUser) return

    const checkInterval = setInterval(async () => {
      try {
        if (!auth?.currentUser) return
        const currentUser = auth.currentUser
        await reload(currentUser)
        const updatedUser = auth?.currentUser
        if (updatedUser?.emailVerified) {
          clearInterval(checkInterval)
          toast.success('Email verified! Redirecting...')
          setTimeout(() => {
            onVerified?.()
          }, 1000)
        }
      } catch (error) {
        // Silently fail - user can manually check
        console.error('Auto-check verification error:', error)
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(checkInterval)
  }, [onVerified])

  // Check if we're in local/test environment - only show debug option in development mode
  // IMPORTANT: Check for production build - in production builds, import.meta.env.DEV is false
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const isDev = import.meta.env.DEV && import.meta.env.MODE === 'development'
  // Only show debug option if explicitly in dev mode AND localhost (not in production builds)
  const showDebugOption = isLocalhost && isDev && import.meta.env.PROD === false

  const handleResendVerification = async () => {
    if (!auth?.currentUser) {
      toast.error('User session expired. Please sign in again.')
      return
    }
    
    setIsSending(true)
    try {
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}?mode=verifyEmail&continueUrl=${encodeURIComponent(window.location.origin)}`,
        handleCodeInApp: true
      })
      toast.success('Verification email sent! Please check your inbox (and spam folder).')
    } catch (error: any) {
      console.error('Error sending verification email:', error)
      let errorMessage = 'Failed to send verification email'
      
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a few minutes before requesting another email.'
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found. Please sign in again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setIsSending(false)
    }
  }

  const handleCheckVerification = async () => {
    if (!auth?.currentUser) return
    
    setIsChecking(true)
    try {
      // Reload the user to get the latest verification status
      await reload(auth.currentUser)
      
      // Wait a moment for the auth state to update
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Get the current user again after reload
      const currentUser = auth.currentUser
      if (!currentUser) {
        toast.error('User session expired. Please sign in again.')
        return
      }
      
      // Check if we're in local/test and have local verification flag
      const hasLocalVerification = showDebugOption && localStorage.getItem(`email-verified-local-${currentUser.uid}`) === 'true'
      
      // Check verification status
      if (currentUser.emailVerified || hasLocalVerification) {
        toast.success('Email verified! Redirecting...')
        setTimeout(() => {
          onVerified?.()
        }, 1000)
      } else {
        // Try one more time after a short delay (sometimes Firebase needs a moment)
        await new Promise(resolve => setTimeout(resolve, 1000))
        await reload(currentUser)
        const recheckedUser = auth.currentUser
        if (recheckedUser?.emailVerified || hasLocalVerification) {
          toast.success('Email verified! Redirecting...')
          setTimeout(() => {
            onVerified?.()
          }, 1000)
        } else {
          toast.error('Email not yet verified. Please check your inbox and click the verification link. Make sure you clicked the link in the email.')
        }
      }
    } catch (error: any) {
      console.error('Error checking verification:', error)
      // In local/test, check for local verification flag as fallback
      const hasLocalVerification = showDebugOption && localStorage.getItem(`email-verified-local-${auth.currentUser?.uid}`) === 'true'
      if (hasLocalVerification) {
        toast.success('Email verified! Redirecting...')
        setTimeout(() => {
          onVerified?.()
        }, 1000)
      } else {
        toast.error(`Error checking verification status: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setIsChecking(false)
    }
  }

  const handleAutoVerify = async () => {
    if (!auth?.currentUser) return
    
    setIsChecking(true)
    try {
      // In local/test, mark email as verified locally
      // Store in localStorage so it persists
      localStorage.setItem(`email-verified-local-${auth.currentUser.uid}`, 'true')
      
      toast.success('Email marked as verified (Local Only)')
      setTimeout(() => {
        onVerified?.()
      }, 500)
    } catch (error: any) {
      console.error('Error in test verification:', error)
      toast.error('Error marking email as verified')
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Mail className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-3">
            Verify Your Email
          </h1>
          
          {/* Description */}
          <p className="text-gray-600 text-center mb-6">
            We've sent a verification email to <span className="font-semibold text-gray-900">{user?.email}</span>
          </p>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">Why verify your email?</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                  <li>Prevent spam and fake accounts</li>
                  <li>Secure your account</li>
                  <li>Access all platform features</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <p className="text-sm text-gray-700">Check your inbox for an email from us</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <p className="text-sm text-gray-700">Click the verification link in the email</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <p className="text-sm text-gray-700">Come back here and click "I've Verified My Email"</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleCheckVerification}
              disabled={isChecking}
              className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {isChecking ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Checking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  I've Verified My Email
                </>
              )}
            </button>
            <button
              onClick={handleResendVerification}
              disabled={isSending}
              className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Resend Verification Email
                </>
              )}
            </button>
            
            {/* Local/Test Only Option */}
            {showDebugOption && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Development Mode</span>
                  </div>
                </div>
                <button
                  onClick={handleAutoVerify}
                  disabled={isChecking}
                  className="w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  {isChecking ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Mark as Verified (Local Only)
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  This option is only available in local/test environments for development purposes.
                </p>
              </>
            )}
          </div>

          {/* Help text */}
          <p className="text-xs text-gray-500 text-center mt-6">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
        </div>
      </div>
    </div>
  )
}

