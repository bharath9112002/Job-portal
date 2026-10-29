import { useState } from 'react'
import { AuthContext, REMEMBER_KEY } from './useAuth'
import { clearSession, findUserByEmail, getSession, saveUser, setSession } from './storage'

function toSession(user) {
  const { password: _password, ...rest } = user
  return { ...rest, loggedInAt: new Date().toISOString() }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession())

  const login = (email, password, remember) => {
    const found = findUserByEmail(email)
    if (!found || found.password !== password) {
      return { ok: false, error: 'Invalid email or password' }
    }
    try {
      if (remember) localStorage.setItem(REMEMBER_KEY, found.email)
      else localStorage.removeItem(REMEMBER_KEY)
    } catch {
      // ignore
    }
    const session = toSession(found)
    setSession(session)
    setUser(session)
    return { ok: true }
  }

  const register = ({ name, email, password }) => {
    if (findUserByEmail(email)) {
      return { ok: false, error: 'An account with this email already exists' }
    }
    const newUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'admin',
      createdAt: new Date().toISOString(),
    }
    saveUser(newUser)
    const session = toSession(newUser)
    setSession(session)
    setUser(session)
    return { ok: true }
  }

  const logout = () => {
    clearSession()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>
}
