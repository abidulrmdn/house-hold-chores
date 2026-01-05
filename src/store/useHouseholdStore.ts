import { create } from 'zustand'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { Household, User } from '@/types'

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
      const household: Omit<Household, 'id'> = {
        name,
        members: [userId],
        createdAt: Date.now(),
        createdBy: userId
      }
      const docRef = await setDoc(doc(db, 'households', userId), household)
      
      // Update user with household ID
      await updateDoc(doc(db, 'users', userId), {
        householdId: userId
      })

      set({ household: { id: userId, ...household }, loading: false })
      return userId
    } catch (error) {
      console.error('Error creating household:', error)
      set({ loading: false })
      throw error
    }
  },

  joinHousehold: async (householdId: string, userId: string) => {
    set({ loading: true })
    try {
      const householdDoc = await getDoc(doc(db, 'households', householdId))
      if (!householdDoc.exists()) {
        throw new Error('Household not found')
      }

      const household = householdDoc.data() as Household
      if (!household.members.includes(userId)) {
        await updateDoc(doc(db, 'households', householdId), {
          members: [...household.members, userId]
        })
      }

      await updateDoc(doc(db, 'users', userId), {
        householdId
      })

      set({ household: { id: householdId, ...household }, loading: false })
    } catch (error) {
      console.error('Error joining household:', error)
      set({ loading: false })
      throw error
    }
  },

  loadHousehold: async (householdId: string) => {
    set({ loading: true })
    try {
      const householdDoc = await getDoc(doc(db, 'households', householdId))
      if (householdDoc.exists()) {
        set({ household: { id: householdId, ...householdDoc.data() } as Household, loading: false })
      } else {
        set({ household: null, loading: false })
      }
    } catch (error) {
      console.error('Error loading household:', error)
      set({ loading: false })
    }
  }
}))

