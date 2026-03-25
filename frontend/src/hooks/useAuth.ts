import { createElement, createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { apiLogin, apiGetMe, apiLogout, getToken } from '../lib/api'
import type { AuthUser } from '../lib/api'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Provides authentication state and actions.
 * On mount, validates any stored token via GET /api/auth/me.
 * Wrap the component tree that needs auth with this provider.
 */
export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      // Use microtask to avoid synchronous setState in effect body
      void Promise.resolve().then(() => setIsLoading(false))
      return
    }
    apiGetMe()
      .then((u) => setUser(u))
      .catch(() => {
        // Token is invalid or expired
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (name: string): Promise<void> => {
    const result = await apiLogin(name)
    setUser(result.user)
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    await apiLogout()
    setUser(null)
  }, [])

  const value: AuthContextValue = { user, isLoading, login, logout }
  return createElement(AuthContext.Provider, { value }, children)
}

/**
 * Returns the current auth state and actions.
 * Must be called within an AuthProvider subtree.
 *
 * @throws {Error} When used outside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
