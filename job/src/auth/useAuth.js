import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

export const REMEMBER_KEY = 'jobportal_remember_email'

export function getRememberedEmail() {
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
