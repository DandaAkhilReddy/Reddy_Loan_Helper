import { createElement, createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'

interface DarkModeContextValue {
  isDark: boolean
  toggle: () => void
}

const STORAGE_KEY = 'reddy-loan-dark-mode'

const DarkModeContext = createContext<DarkModeContextValue | null>(null)

function getInitialDarkMode(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') return true
    if (stored === 'false') return false
  } catch { /* SSR or blocked */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Provides dark mode state with localStorage persistence and system preference detection.
 * Applies/removes the 'dark' class on document.documentElement to enable Tailwind dark mode.
 */
export function DarkModeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [isDark, setIsDark] = useState(getInitialDarkMode)

  const toggle = useCallback(() => {
    setIsDark(prev => {
      const next = !prev
      try { localStorage.setItem(STORAGE_KEY, String(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const value: DarkModeContextValue = { isDark, toggle }
  return createElement(DarkModeContext.Provider, { value }, children)
}

/**
 * Returns the current dark mode state and toggle function.
 * Must be called within a DarkModeProvider subtree.
 *
 * @throws {Error} When used outside DarkModeProvider
 */
export function useDarkMode(): DarkModeContextValue {
  const ctx = useContext(DarkModeContext)
  if (!ctx) throw new Error('useDarkMode must be used within DarkModeProvider')
  return ctx
}
