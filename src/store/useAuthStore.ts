import { create } from 'zustand'
import { User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { User } from '@/types'

interface AuthState {
  user: FirebaseUser | null
  userData: User | null
  loading: boolean
  setUser: (user: FirebaseUser | null) => void
  setUserData: (userData: User | null) => void
  setLoading: (loading: boolean) => void
  loadUserData: () => Promise<void>
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
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (userDoc.exists()) {
        set({ userData: userDoc.data() as User, loading: false })
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
        set({ userData: newUserData, loading: false })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      set({ loading: false })
    }
  }
}))

