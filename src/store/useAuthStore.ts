import { create } from 'zustand'
import { User as FirebaseUser, updateProfile } from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db, auth } from '@/firebase/config'
import { User } from '@/types'

interface AuthState {
  user: FirebaseUser | null
  userData: User | null
  loading: boolean
  setUser: (user: FirebaseUser | null) => void
  setUserData: (userData: User | null) => void
  setLoading: (loading: boolean) => void
  loadUserData: () => Promise<void>
  updateUserData: (updates: { displayName?: string; photoURL?: string }) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userData: null,
  loading: true,
  setUser: (user) => set({ user }),
  setUserData: (userData) => set({ userData }),
  setLoading: (loading) => set({ loading }),
  loadUserData: async () => {
    const { user } = get()
    if (!user) {
      set({ userData: null, loading: false })
      return
    }

    try {
      if (!db) {
        throw new Error('Firestore not initialized')
      }
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data() as User
        set({ userData, loading: false })
        
        // Load language preference from Firestore if available
        if (userData.language && typeof window !== 'undefined') {
          const { useLanguageStore } = await import('@/store/useLanguageStore')
          const { getCurrentLanguage } = await import('@/i18n')
          const currentLang = getCurrentLanguage()
          // Only update if different to avoid unnecessary reloads
          if (currentLang !== userData.language) {
            localStorage.setItem('language', userData.language)
            useLanguageStore.getState().setLanguage(userData.language, false) // Don't save back to Firestore
          }
        }
      } else {
        // Create user document if it doesn't exist
        const userData: any = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          createdAt: Date.now()
        }
        // Only add photoURL if it exists (Firestore doesn't allow undefined)
        if (user.photoURL) {
          userData.photoURL = user.photoURL
        }
        await setDoc(doc(db, 'users', user.uid), userData)
        set({ userData: userData as User, loading: false })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      set({ loading: false })
    }
  },
  updateUserData: async (updates) => {
    const { user, userData } = get()
    if (!user || !userData || !db) {
      throw new Error('User not authenticated or Firestore not initialized')
    }

    try {
      // Update Firebase Auth profile if photoURL or displayName changed
      const authUpdates: { displayName?: string; photoURL?: string } = {}
      if (updates.displayName !== undefined) {
        authUpdates.displayName = updates.displayName
      }
      if (updates.photoURL !== undefined) {
        authUpdates.photoURL = updates.photoURL
      }

      if (Object.keys(authUpdates).length > 0 && auth?.currentUser) {
        await updateProfile(auth.currentUser, authUpdates)
      }

      // Update Firestore user document
      const userDocRef = doc(db, 'users', user.uid)
      const firestoreUpdates: any = {}
      if (updates.displayName !== undefined) {
        firestoreUpdates.displayName = updates.displayName
      }
      if (updates.photoURL !== undefined) {
        if (updates.photoURL) {
          firestoreUpdates.photoURL = updates.photoURL
        } else {
          // Remove photoURL if set to empty/null
          firestoreUpdates.photoURL = null
        }
      }

      if (Object.keys(firestoreUpdates).length > 0) {
        await updateDoc(userDocRef, firestoreUpdates)
      }

      // Update local state
      const updatedUserData = {
        ...userData,
        ...firestoreUpdates
      }
      set({ userData: updatedUserData as User })
    } catch (error) {
      console.error('Error updating user data:', error)
      throw error
    }
  }
}))

