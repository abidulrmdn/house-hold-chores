import { create } from 'zustand'
import { Language, getCurrentLanguage, setLanguage as setLang, getTextDirection } from '@/i18n'
import { doc, updateDoc } from 'firebase/firestore'
import { db, auth } from '@/firebase/config'

interface LanguageState {
  language: Language
  direction: 'ltr' | 'rtl'
  setLanguage: (language: Language, saveToFirestore?: boolean) => Promise<void>
}

export const useLanguageStore = create<LanguageState>((set) => {
  const currentLang = getCurrentLanguage()
  
  return {
    language: currentLang,
    direction: getTextDirection(currentLang),
    setLanguage: async (language: Language, saveToFirestore = true) => {
      // Save to localStorage (without reload for now)
      setLang(language, false)
      
      // Save to Firestore if user is signed in
      if (saveToFirestore && auth?.currentUser && db) {
        try {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            language
          })
        } catch (error) {
          console.error('Error saving language preference to Firestore:', error)
          // Don't throw - language change should still work even if Firestore save fails
        }
      }
      
      set({ 
        language,
        direction: getTextDirection(language)
      })
      
      // Apply direction immediately
      if (typeof document !== 'undefined') {
        document.documentElement.dir = getTextDirection(language)
      }
      
      // Reload only if saveToFirestore is true (user-initiated change)
      if (saveToFirestore) {
        window.location.reload()
      }
    }
  }
})

// Initialize language on store creation
if (typeof window !== 'undefined') {
  const store = useLanguageStore.getState()
  const currentLang = getCurrentLanguage()
  if (store.language !== currentLang) {
    store.setLanguage(currentLang)
  }
  
  // Listen for language changes
  window.addEventListener('languagechange', () => {
    const newLang = getCurrentLanguage()
    useLanguageStore.getState().setLanguage(newLang)
  })
}

