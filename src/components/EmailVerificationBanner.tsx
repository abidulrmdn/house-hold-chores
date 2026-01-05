import { useState } from 'react'
import { sendEmailVerification, reload } from 'firebase/auth'
import { auth } from '@/firebase/config'
import { X, Mail, AlertCircle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface EmailVerificationBannerProps {
  user: any
  onVerified?: () => void
}

export default function EmailVerificationBanner({ user, onVerified }: EmailVerificationBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Check if we're in local/test environment
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development'

  // Auto-verify in local/test environment
  const handleAutoVerify = async () => {
    if (!auth?.currentUser) return
    
    setIsVerifying(true)
    try {
      // In local/test, we can't actually verify, but we can reload the user
      // For real verification, user needs to click the link in production
      await reload(auth.currentUser)
      if (auth.currentUser.emailVerified) {
        toast.success('Email verified!')
        onVerified?.()
      }
    } catch (error: any) {
      console.error('Error verifying email:', error)
      toast.error('Error verifying email')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendVerification = async () => {
    if (!auth?.currentUser) return
    
    setIsSending(true)
    try {
      await sendEmailVerification(auth.currentUser)
      toast.success('Verification email sent! Please check your inbox.')
    } catch (error: any) {
      console.error('Error sending verification email:', error)
      toast.error(error.message || 'Failed to send verification email')
    } finally {
      setIsSending(false)
    }
  }

  const handleCheckVerification = async () => {
    if (!auth?.currentUser) return
    
    setIsVerifying(true)
    try {
      await reload(auth.currentUser)
      if (auth.currentUser.emailVerified) {
        toast.success('Email verified!')
        onVerified?.()
      } else {
        toast.error('Email not yet verified. Please check your inbox.')
      }
    } catch (error: any) {
      console.error('Error checking verification:', error)
      toast.error('Error checking verification status')
    } finally {
      setIsVerifying(false)
    }
  }

  if (isDismissed || !user || user.emailVerified) {
    return null
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Email Verification Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  Please verify your email address ({user.email}) to access all features and prevent spam accounts.
                </p>
                {(isLocalhost || isDev) && (
                  <p className="mt-1 text-xs italic">
                    Local/test environment detected - verification is optional
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsDismissed(true)}
              className="ml-4 flex-shrink-0 text-yellow-400 hover:text-yellow-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            {(isLocalhost || isDev) ? (
              <button
                onClick={handleAutoVerify}
                disabled={isVerifying}
                className="inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Mark as Verified (Test)
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={handleResendVerification}
                  disabled={isSending}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Resend Verification Email
                    </>
                  )}
                </button>
                <button
                  onClick={handleCheckVerification}
                  disabled={isVerifying}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-800 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                      Checking...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      I've Verified My Email
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

