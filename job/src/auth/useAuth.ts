import { createContext, useContext } from 'react'
import type { SessionUser } from './storage'

interface AuthResult {
  ok: boolean
  error?: string
}

export interface AuthContextValue {
  user: SessionUser | null
  login: (email: string, password: string, remember: boolean) => AuthResult
  register: (data: { name: string; email: string; password: string }) => AuthResult
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export const REMEMBER_KEY = 'jobportal_remember_email'

export function getRememberedEmail(): string {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? ''
  } catch {
    return ''
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
