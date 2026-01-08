/**
 * Utility functions for device detection
 */

/**
 * Check if the app is running on a mobile device
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check for Capacitor (native mobile app)
  if ((window as any).Capacitor) {
    return true
  }
  
  // Check user agent for mobile devices
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
  return mobileRegex.test(userAgent.toLowerCase())
}

/**
 * Check if the app is running on Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check for Capacitor Android platform
  if ((window as any).Capacitor?.getPlatform() === 'android') {
    return true
  }
  
  // Check user agent for Android
  return /android/i.test(navigator.userAgent)
}

/**
 * Check if the app is running on iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check for Capacitor iOS platform
  if ((window as any).Capacitor?.getPlatform() === 'ios') {
    return true
  }
  
  // Check user agent for iOS
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

/**
 * Check if the app is running as a native app (via Capacitor)
 * Only returns true if actually running on Android/iOS native platform, not mobile web
 */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false
  
  const Capacitor = (window as any).Capacitor
  if (!Capacitor) return false
  
  // Check if actually running on native platform (not web)
  const platform = Capacitor.getPlatform?.()
  return platform === 'android' || platform === 'ios'
}

/**
 * Get the public base URL for the app
 * Returns the public URL for native apps, or window.location.origin for web
 */
export function getPublicUrl(): string {
  // Public URL for the deployed app
  const PUBLIC_URL = 'https://household-chores-d8eae.web.app'
  
  // If running in native app, use public URL
  if (isNativeApp()) {
    return PUBLIC_URL
  }
  
  // For web, use current origin (works for both localhost and production)
  if (typeof window !== 'undefined') {
    // If already on production URL, use it
    if (window.location.origin.includes('household-chores-d8eae.web.app') || 
        window.location.origin.includes('household-chores-d8eae.firebaseapp.com')) {
      return window.location.origin
    }
    // Otherwise use public URL (for localhost development)
    return PUBLIC_URL
  }
  
  return PUBLIC_URL
}

