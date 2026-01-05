import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  effectiveTheme: 'light' | 'dark'
}

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem('theme')
  return (stored as Theme) || 'system'
}

const getEffectiveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

export const useThemeStore = create<ThemeStore>((set) => {
  // Initialize theme on mount
  if (typeof window !== 'undefined') {
    const theme = getStoredTheme()
    const effectiveTheme = getEffectiveTheme(theme)
    document.documentElement.classList.toggle('dark', effectiveTheme === 'dark')
  }

  return {
    theme: typeof window !== 'undefined' ? getStoredTheme() : 'system',
    effectiveTheme: typeof window !== 'undefined' ? getEffectiveTheme(getStoredTheme()) : 'light',
    setTheme: (theme: Theme) => {
      localStorage.setItem('theme', theme)
      const effectiveTheme = getEffectiveTheme(theme)
      set({ theme, effectiveTheme })
      document.documentElement.classList.toggle('dark', effectiveTheme === 'dark')
    }
  }
})

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const store = useThemeStore.getState()
    if (store.theme === 'system') {
      const effectiveTheme = e.matches ? 'dark' : 'light'
      store.effectiveTheme = effectiveTheme
      document.documentElement.classList.toggle('dark', effectiveTheme === 'dark')
    }
  })
}

