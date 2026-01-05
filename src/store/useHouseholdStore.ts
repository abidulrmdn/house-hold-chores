import { create } from 'zustand'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db, auth } from '@/firebase/config'
import { Household } from '@/types'

interface HouseholdState {
  household: Household | null
  loading: boolean
  createHousehold: (name: string, userId: string) => Promise<string>
  joinHousehold: (householdId: string, userId: string) => Promise<void>
  loadHousehold: (householdId: string) => Promise<void>
}

export const useHouseholdStore = create<HouseholdState>((set) => ({
  household: null,
  loading: false,

  createHousehold: async (name: string, userId: string) => {
    set({ loading: true })
    try {
      if (!db) {
        throw new Error('Firestore database not initialized. Please check your Firebase configuration.')
      }

      const household: Omit<Household, 'id'> = {
        name,
        members: [userId],
        createdAt: Date.now(),
        createdBy: userId
      }
      
      // Create household document
      await setDoc(doc(db, 'households', userId), household)
      
      // Update user with household ID
      await updateDoc(doc(db, 'users', userId), {
        householdId: userId
      })

      set({ household: { id: userId, ...household }, loading: false })
      return userId
    } catch (error: any) {
      console.error('Error creating household:', error)
      set({ loading: false })
      
      // Provide more helpful error messages
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Make sure Firestore database is created and rules are deployed.')
      } else if (error.code === 'unavailable') {
        throw new Error('Firestore is unavailable. Please check your internet connection and Firebase project settings.')
      } else if (error.message?.includes('not initialized')) {
        throw new Error('Firebase not configured. Please check your .env file.')
      }
      
      throw error
    }
  },

  joinHousehold: async (householdId: string, userId: string) => {
    set({ loading: true })
    try {
      if (!db) {
        throw new Error('Firestore database not initialized. Please check your Firebase configuration.')
      }

      console.log('Looking up household:', householdId)
      const householdDoc = await getDoc(doc(db, 'households', householdId))
      
      if (!householdDoc.exists()) {
        console.error('Household document does not exist:', householdId)
        // Try to provide more helpful error
        const error: any = new Error('Household not found. Please check the Household ID.')
        error.code = 'not-found'
        throw error
      }

      const householdData = householdDoc.data()
      console.log('Household found:', householdData)
      
      const household: Household = {
        id: householdId,
        name: householdData.name,
        members: householdData.members || [],
        createdAt: householdData.createdAt || Date.now(),
        createdBy: householdData.createdBy || userId
      }
      
      // Check if user is already a member
      if (household.members.includes(userId)) {
        console.log('User is already a member')
        // Still update user document to ensure householdId is set
        const userDocRef = doc(db, 'users', userId)
        const userDoc = await getDoc(userDocRef)
        
        if (userDoc.exists()) {
          await updateDoc(userDocRef, {
            householdId
          })
        } else {
          // Create user document if it doesn't exist
          console.log('User document does not exist, creating it')
          const currentUser = auth?.currentUser
          
          if (currentUser) {
            const userData: any = {
              id: userId,
              email: currentUser.email || '',
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
              householdId: householdId,
              createdAt: Date.now()
            }
            // Only add photoURL if it exists (Firestore doesn't allow undefined)
            if (currentUser.photoURL) {
              userData.photoURL = currentUser.photoURL
            }
            await setDoc(userDocRef, userData)
          } else {
            throw new Error('User not authenticated')
          }
        }
        set({ household, loading: false })
        return
      }
      
      // Add user to members
      console.log('Adding user to household members')
      await updateDoc(doc(db, 'households', householdId), {
        members: [...household.members, userId]
      })
      household.members = [...household.members, userId]

      // Update or create user document
      console.log('Updating user document with householdId')
      const userDocRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userDocRef)
      
      if (userDoc.exists()) {
        // Update existing user document
        await updateDoc(userDocRef, {
          householdId
        })
      } else {
        // Create user document if it doesn't exist
        console.log('User document does not exist, creating it')
        const currentUser = auth?.currentUser
        
        if (currentUser) {
          const userData: any = {
            id: userId,
            email: currentUser.email || '',
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            householdId: householdId,
            createdAt: Date.now()
          }
          // Only add photoURL if it exists (Firestore doesn't allow undefined)
          if (currentUser.photoURL) {
            userData.photoURL = currentUser.photoURL
          }
          await setDoc(userDocRef, userData)
        } else {
          throw new Error('User not authenticated')
        }
      }

      set({ household, loading: false })
      console.log('Successfully joined household')
    } catch (error: any) {
      console.error('Error joining household:', error)
      set({ loading: false })
      
      // Preserve error code and message
      if (error.code) {
        const newError: any = new Error(error.message || 'Failed to join household')
        newError.code = error.code
        throw newError
      }
      throw error
    }
  },

  loadHousehold: async (householdId: string) => {
    set({ loading: true })
    try {
      if (!db) {
        console.warn('Firestore database not initialized')
        set({ household: null, loading: false })
        return
      }

      const householdDoc = await getDoc(doc(db, 'households', householdId))
      if (householdDoc.exists()) {
        const data = householdDoc.data()
        set({ household: { ...data, id: householdId } as Household, loading: false })
      } else {
        set({ household: null, loading: false })
      }
    } catch (error) {
      console.error('Error loading household:', error)
      set({ household: null, loading: false })
    }
  }
}))

