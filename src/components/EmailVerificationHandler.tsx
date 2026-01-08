import { useEffect, useState } from 'react'
import { applyActionCode, verifyPasswordResetCode, reload } from 'firebase/auth'
import { auth } from '@/firebase/config'
import { useAuthStore } from '@/store/useAuthStore'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface EmailVerificationHandlerProps {
  mode: string
  oobCode: string
  continueUrl?: string
}

export default function EmailVerificationHandler({ mode, oobCode, continueUrl }: EmailVerificationHandlerProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const { setUser, loadUserData } = useAuthStore()

  useEffect(() => {
    const handleEmailAction = async () => {
      if (!auth || !oobCode) {
        setStatus('error')
        setMessage('Invalid verification link')
        return
      }

      try {
        if (mode === 'verifyEmail') {
          // Verify email using the action code
          await applyActionCode(auth, oobCode)
          
          // Wait a moment for Firebase to process
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Reload user to get updated verification status
          const currentUser = auth.currentUser
          if (currentUser) {
            await reload(currentUser)
            // Wait for reload to complete
            await new Promise(resolve => setTimeout(resolve, 300))
            
            // Get fresh user reference
            const updatedUser = auth.currentUser
            if (updatedUser) {
              setUser(updatedUser)
              await loadUserData()
            }
          }
          
          setStatus('success')
          setMessage('Email verified successfully! Redirecting...')
          toast.success('Email verified successfully!')
          
          // Redirect after 2 seconds
          setTimeout(() => {
            if (continueUrl) {
              try {
                const url = new URL(continueUrl)
                window.location.href = url.pathname + url.search
              } catch {
                window.location.href = continueUrl
              }
            } else {
              window.location.href = '/'
            }
          }, 2000)
        } else if (mode === 'resetPassword') {
          // Handle password reset (for future use)
          await verifyPasswordResetCode(auth, oobCode)
          setStatus('success')
          setMessage('Password reset link verified. You can now reset your password.')
          // Redirect to password reset page
          setTimeout(() => {
            window.location.href = continueUrl || '/'
          }, 2000)
        } else {
          setStatus('error')
          setMessage('Unknown action type')
        }
      } catch (error: any) {
        console.error('Error handling email action:', error)
        setStatus('error')
        
        let errorMessage = 'Failed to verify email'
        if (error.code === 'auth/invalid-action-code') {
          errorMessage = 'This verification link has expired or is invalid. Please request a new verification email.'
        } else if (error.code === 'auth/expired-action-code') {
          errorMessage = 'This verification link has expired. Please request a new verification email.'
        } else if (error.code === 'auth/user-disabled') {
          errorMessage = 'This account has been disabled. Please contact support.'
        } else if (error.code === 'auth/user-not-found') {
          errorMessage = 'User account not found. Please sign up again.'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        setMessage(errorMessage)
        toast.error(errorMessage)
      }
    }

    handleEmailAction()
  }, [mode, oobCode, continueUrl, setUser, loadUserData])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-6">
                <Loader2 className="w-16 h-16 text-primary-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
                Verifying Email...
              </h1>
              <p className="text-gray-600 text-center">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
                Email Verified!
              </h1>
              <p className="text-gray-600 text-center">
                {message}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
                Verification Failed
              </h1>
              <p className="text-gray-600 text-center mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Go to Home
                </button>
                {mode === 'verifyEmail' && (
                  <button
                    onClick={() => window.location.href = '/auth'}
                    className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Request New Verification Email
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

