import { createContext, useContext, useState, type ReactNode } from 'react'
import { clearToken, getStoredUser, setStoredUser, setToken } from '../lib/auth'
import { apiLoginWithGoogle } from '../lib/services/auth'
import type { User } from '../lib/types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  signInWithGoogle: (credential: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser() as User | null)
  const [isLoading] = useState(false)

  const signInWithGoogle = async (credential: string) => {
    const session = await apiLoginWithGoogle(credential)
    setToken(session.token)
    setStoredUser(session.user)
    setUser(session.user)
  }

  const signOut = () => {
    clearToken()
    setStoredUser(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}