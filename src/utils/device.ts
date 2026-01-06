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
 */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).Capacitor
}

