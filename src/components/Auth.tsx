import { useState, useEffect } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendEmailVerification } from 'firebase/auth'
import { auth, googleProvider } from '@/firebase/config'
import { useAuthStore } from '@/store/useAuthStore'
import { useLanguageStore } from '@/store/useLanguageStore'
import { useTranslation } from '@/hooks/useTranslation'
import LanguageSelector from '@/components/LanguageSelector'
import { LogIn, Mail, Lock, UserPlus, Home, Users, Calendar, Bell, BarChart3, Sparkles, CheckSquare, Zap, Shield, Smartphone, ChevronLeft, ChevronRight, Tag, Search, Moon, History, Filter, Keyboard, TrendingUp, Clock, ArrowRight, CheckCircle2, Heart, Globe } from 'lucide-react'
import { isMobile } from '@/utils/device'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLanguageSelectorOpen, setIsLanguageSelectorOpen] = useState(false)
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const { setUser, loadUserData } = useAuthStore()
  const { direction } = useLanguageStore()
  const { t } = useTranslation()

  // Detect mobile device
  useEffect(() => {
    setIsMobileDevice(isMobile())
  }, [])

  // Apply text direction based on language
  useEffect(() => {
    document.documentElement.dir = direction
  }, [direction])

  useEffect(() => {
    if (!auth) {
      console.warn('Auth not available - Firebase not configured')
      return
    }
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user)
      if (user) {
        await loadUserData()
      }
    })
    return unsubscribe
  }, [setUser, loadUserData, auth])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth) {
      alert('Firebase is not configured. Please set up your .env file. See README.md for instructions.')
      return
    }
    setLoading(true)
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        
        // Send email verification (unless in local/test environment)
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development'
        
        if (!isLocalhost && !isDev) {
          // In production, send verification email
          try {
            await sendEmailVerification(user)
            alert('Verification email sent! Please check your inbox and verify your email before continuing.')
          } catch (verificationError: any) {
            console.error('Error sending verification email:', verificationError)
            // Don't block signup if verification email fails
          }
        } else {
          // In local/test, auto-verify email
          console.log('Local/test environment detected - skipping email verification')
        }
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    if (!auth || !googleProvider) {
      alert(t('auth.signIn'))
      return
    }
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: Home,
      titleKey: 'auth.features.smartRoutines',
      descriptionKey: 'auth.features.smartRoutinesDesc',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50'
    },
    {
      icon: Users,
      titleKey: 'auth.features.familyCollaboration',
      descriptionKey: 'auth.features.familyCollaborationDesc',
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50'
    },
    {
      icon: Calendar,
      titleKey: 'auth.features.calendarView',
      descriptionKey: 'auth.features.calendarViewDesc',
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50'
    },
    {
      icon: Bell,
      titleKey: 'auth.features.smartNotifications',
      descriptionKey: 'auth.features.smartNotificationsDesc',
      gradient: 'from-orange-500 to-amber-500',
      bgGradient: 'from-orange-50 to-amber-50'
    },
    {
      icon: BarChart3,
      titleKey: 'auth.features.statisticsInsights',
      descriptionKey: 'auth.features.statisticsInsightsDesc',
      gradient: 'from-pink-500 to-rose-500',
      bgGradient: 'from-pink-50 to-rose-50'
    },
    {
      icon: Sparkles,
      titleKey: 'auth.features.aiSuggestions',
      descriptionKey: 'auth.features.aiSuggestionsDesc',
      gradient: 'from-indigo-500 to-purple-500',
      bgGradient: 'from-indigo-50 to-purple-50'
    },
    {
      icon: CheckSquare,
      titleKey: 'auth.features.swipeToComplete',
      descriptionKey: 'auth.features.swipeToCompleteDesc',
      gradient: 'from-teal-500 to-cyan-500',
      bgGradient: 'from-teal-50 to-cyan-50'
    },
    {
      icon: Tag,
      titleKey: 'auth.features.categoryOrganization',
      descriptionKey: 'auth.features.categoryOrganizationDesc',
      gradient: 'from-violet-500 to-purple-500',
      bgGradient: 'from-violet-50 to-purple-50'
    },
    {
      icon: Filter,
      titleKey: 'auth.features.smartFilters',
      descriptionKey: 'auth.features.smartFiltersDesc',
      gradient: 'from-amber-500 to-yellow-500',
      bgGradient: 'from-amber-50 to-yellow-50'
    },
    {
      icon: Search,
      titleKey: 'auth.features.quickSearch',
      descriptionKey: 'auth.features.quickSearchDesc',
      gradient: 'from-sky-500 to-blue-500',
      bgGradient: 'from-sky-50 to-blue-50'
    },
    {
      icon: TrendingUp,
      titleKey: 'auth.features.streakTracking',
      descriptionKey: 'auth.features.streakTrackingDesc',
      gradient: 'from-emerald-500 to-green-500',
      bgGradient: 'from-emerald-50 to-green-50'
    },
    {
      icon: Moon,
      titleKey: 'auth.features.darkMode',
      descriptionKey: 'auth.features.darkModeDesc',
      gradient: 'from-slate-500 to-gray-500',
      bgGradient: 'from-slate-50 to-gray-50'
    },
    {
      icon: Keyboard,
      titleKey: 'auth.features.keyboardShortcuts',
      descriptionKey: 'auth.features.keyboardShortcutsDesc',
      gradient: 'from-rose-500 to-pink-500',
      bgGradient: 'from-rose-50 to-pink-50'
    },
    {
      icon: History,
      titleKey: 'auth.features.taskHistory',
      descriptionKey: 'auth.features.taskHistoryDesc',
      gradient: 'from-cyan-500 to-teal-500',
      bgGradient: 'from-cyan-50 to-teal-50'
    },
    {
      icon: Clock,
      titleKey: 'auth.features.smartScheduling',
      descriptionKey: 'auth.features.smartSchedulingDesc',
      gradient: 'from-fuchsia-500 to-pink-500',
      bgGradient: 'from-fuchsia-50 to-pink-50'
    },
    {
      icon: Smartphone,
      titleKey: 'auth.features.worksEverywhere',
      descriptionKey: 'auth.features.worksEverywhereDesc',
      gradient: 'from-red-500 to-pink-500',
      bgGradient: 'from-red-50 to-pink-50'
    }
  ]

  // Auto-slide functionality
  useEffect(() => {
    const totalSlides = Math.ceil(features.length / 4)
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [features.length])

  // Reset slide when component mounts to ensure animation plays
  useEffect(() => {
    setCurrentSlide(0)
  }, [])

  const totalSlides = Math.ceil(features.length / 4)

  // Mobile layout: Simple sign-in page with features at bottom
  if (isMobileDevice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-100 via-primary-50 to-purple-50 relative overflow-hidden flex flex-col">
        {/* Language Selector - Top Right */}
        <div className="absolute top-4 right-4 z-50">
          <div className="relative">
            <button
              onClick={() => setIsLanguageSelectorOpen(!isLanguageSelectorOpen)}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-colors flex items-center gap-2 text-gray-700 hover:text-gray-900"
              title={t('language.language')}
            >
              <Globe className="w-5 h-5" />
            </button>
            {isLanguageSelectorOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                <LanguageSelector />
              </div>
            )}
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Sign-in Form Section - Top */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100 relative overflow-hidden">
              {/* Decorative gradient overlay */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full blur-3xl opacity-50 -z-0"></div>
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
                    {isLogin ? (
                      <LogIn className="w-8 h-8 text-white" />
                    ) : (
                      <UserPlus className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {isLogin ? t('auth.welcomeBack') : t('auth.getStarted')}
                  </h2>
                  <p className="text-gray-600 text-sm md:text-base">
                    {isLogin ? t('auth.signInToContinue') : t('auth.createAccountDesc')}
                  </p>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auth.email')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="your@email.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auth.password')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        required
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {isLogin ? t('auth.signingIn') : t('auth.creatingAccount')}
                        </>
                      ) : isLogin ? (
                        <>
                          <LogIn className="w-5 h-5" />
                          {t('auth.signIn')}
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          {t('auth.signUp')}
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </button>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">{t('auth.orContinueWith')}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="mt-4 w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:border-gray-400"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {t('auth.continueWithGoogle')}
                  </button>
                </div>

                <p className="mt-6 text-center text-sm text-gray-600">
                  {isLogin ? t('auth.dontHaveAccount') + ' ' : t('auth.alreadyHaveAccount') + ' '}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-primary-600 hover:text-primary-700 font-semibold transition-colors inline-flex items-center gap-1 group"
                  >
                    {isLogin ? t('auth.signUp') : t('auth.signIn')}
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section - Bottom (Scrollable) */}
        <div className="relative z-10 pb-8">
          <div className="px-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">{t('auth.everythingYouNeed')}</h3>
            <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              <div className="flex gap-4 min-w-max">
                {features.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-4 shadow-lg min-w-[200px] max-w-[200px] border border-gray-100"
                    >
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} mb-3 shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1.5">{t(feature.titleKey)}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{t(feature.descriptionKey)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Desktop layout: Full landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 via-primary-50 to-purple-50 relative overflow-hidden">
      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <div className="relative">
          <button
            onClick={() => setIsLanguageSelectorOpen(!isLanguageSelectorOpen)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-colors flex items-center gap-2 text-gray-700 hover:text-gray-900"
            title={t('language.language')}
          >
            <Globe className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">{t('language.language')}</span>
          </button>
          {isLanguageSelectorOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
              <LanguageSelector />
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-32 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
      </div>
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 lg:py-20 relative z-10">
        <div className="text-center mb-16 animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full mb-6 text-sm font-medium text-primary-700 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span>{t('auth.trustedBy')}</span>
          </div>
          
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary-600 to-purple-600 rounded-3xl mb-6 shadow-2xl transform hover:scale-110 transition-transform animate-pulse-glow relative">
            <Home className="w-12 h-12 text-white animate-float relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-purple-400 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
            {t('auth.heroTitle')}
            <span className="block bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
              {t('auth.heroSubtitle')}
            </span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-gray-700 max-w-3xl mx-auto mb-8 leading-relaxed font-medium">
            {t('auth.heroDescription')} 
            <span className="text-primary-600 font-semibold"> {t('auth.heroDescriptionHighlight')}</span> {t('auth.heroDescriptionEnd')}
          </p>

          {/* Primary CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={() => {
                setIsLogin(false)
                const formElement = document.getElementById('auth-form')
                formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                setTimeout(() => {
                  const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
                  emailInput?.focus()
                }, 500)
              }}
              className="group bg-gradient-to-r from-primary-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-primary-500/50 hover:from-primary-700 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center gap-2 relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                {t('auth.getStartedFree')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </button>
            <button
              onClick={() => {
                setIsLogin(true)
                const formElement = document.getElementById('auth-form')
                formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="px-8 py-4 rounded-xl font-semibold text-lg text-gray-700 hover:text-gray-900 border-2 border-gray-300 hover:border-gray-400 transition-all hover:bg-gray-50"
            >
              {t('auth.signIn')}
            </button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-gray-700">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="font-semibold">{t('auth.statsFree')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{t('auth.statsSetup')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Shield className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">{t('auth.statsSecure')}</span>
            </div>
          </div>
        </div>

        {/* Why Choose Section */}
        <div className="max-w-4xl mx-auto mb-16 animate-fade-in">
          <div className="bg-gradient-to-r from-primary-50 via-purple-50 to-pink-50 rounded-2xl p-8 border border-primary-100 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('auth.whyChoose')}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-full mb-3">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('auth.whyChooseFamily')}</h3>
                <p className="text-sm text-gray-600">{t('auth.whyChooseFamilyDesc')}</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full mb-3">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('auth.whyChooseAI')}</h3>
                <p className="text-sm text-gray-600">{t('auth.whyChooseAIDesc')}</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-600 rounded-full mb-3">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('auth.whyChooseProgress')}</h3>
                <p className="text-sm text-gray-600">{t('auth.whyChooseProgressDesc')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start max-w-7xl mx-auto">
          {/* Features Carousel */}
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">{t('auth.everythingYouNeed')}</h2>
              <div className="hidden lg:flex items-center gap-1 text-sm text-gray-500">
                <span>{t('auth.autoRotating')}</span>
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Carousel Container */}
            <div className="relative">
              <div className="overflow-hidden rounded-2xl">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {Array.from({ length: totalSlides }).map((_, slideIndex) => {
                    const slideFeatures = features.slice(slideIndex * 4, slideIndex * 4 + 4)
                    return (
                      <div key={`slide-${slideIndex}-${currentSlide}`} className="min-w-full">
                        <div className="grid grid-cols-2 gap-4">
                          {slideFeatures.map((feature, featureIndex) => {
                            const Icon = feature.icon
                            const globalIndex = slideIndex * 4 + featureIndex
                            const isVisible = slideIndex === currentSlide
                            return (
                              <div
                                key={`${globalIndex}-${currentSlide}`}
                                className={`bg-gradient-to-br ${feature.bgGradient} rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/50 backdrop-blur-sm ${
                                  isVisible ? 'animate-fade-in' : ''
                                }`}
                                style={{ animationDelay: isVisible ? `${featureIndex * 0.1}s` : '0s' }}
                              >
                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} mb-3 shadow-lg transform transition-all duration-500 hover:scale-110 hover:rotate-6 ${
                                  isVisible ? 'animate-icon-appear' : ''
                                }`}
                                style={{ animationDelay: isVisible ? `${featureIndex * 0.15}s` : '0s' }}>
                                  <Icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900 mb-1.5">{t(feature.titleKey)}</h3>
                                <p className="text-xs text-gray-700 leading-relaxed">{t(feature.descriptionKey)}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Navigation Dots */}
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: totalSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'w-8 bg-primary-600' 
                        : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-gray-200"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % totalSlides)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-gray-200"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Auth Form */}
          <div id="auth-form" className="lg:sticky lg:top-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
              {/* Decorative gradient overlay */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full blur-3xl opacity-50 -z-0"></div>
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-500 rounded-2xl mb-4 shadow-lg">
                    {isLogin ? (
                      <LogIn className="w-8 h-8 text-white" />
                    ) : (
                      <UserPlus className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {isLogin ? t('auth.welcomeBack') : t('auth.getStarted')}
                  </h2>
                  <p className="text-gray-600">
                    {isLogin ? t('auth.signInToContinue') : t('auth.createAccountDesc')}
                  </p>
                </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {isLogin ? t('auth.signingIn') : t('auth.creatingAccount')}
                      </>
                    ) : isLogin ? (
                      <>
                        <LogIn className="w-5 h-5" />
                        {t('auth.signIn')}
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        {t('auth.signUp')}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">{t('auth.orContinueWith')}</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="mt-4 w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:border-gray-400"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t('auth.continueWithGoogle')}
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-gray-600">
                {isLogin ? t('auth.dontHaveAccount') + ' ' : t('auth.alreadyHaveAccount') + ' '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary-600 hover:text-primary-700 font-semibold transition-colors inline-flex items-center gap-1 group"
                >
                  {isLogin ? t('auth.signUp') : t('auth.signIn')}
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </button>
              </p>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>{t('auth.secure')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>{t('auth.fast')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{t('auth.free')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-4xl mx-auto mb-12 animate-fade-in">
          <div className="bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-center text-white shadow-2xl transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-gradient opacity-50"></div>
            <div className="relative z-10">
              <h3 className="text-3xl font-bold mb-4">{t('auth.readyToGetStarted')}</h3>
              <p className="text-lg mb-6 opacity-90">
                {t('auth.readyDescription')}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{t('auth.noCreditCard')}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{t('auth.setupInMinutes')}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{t('auth.freeForever')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

