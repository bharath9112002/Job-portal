import { useState } from 'react'
import { clearSession, findUserByEmail, getSession, saveUser, setRememberedEmail, setSession } from '../auth/storage'
import { AuthContext } from './AuthContext'

function toSession(user) {
  const { password: _password, ...rest } = user
  return { ...rest, loggedInAt: new Date().toISOString() }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession())
  // True after the user clicks Log out, so the next login starts at the dashboard, not the last page.
  const [loggedOut, setLoggedOut] = useState(false)

  const login = (email, password, remember) => {
    const found = findUserByEmail(email)
    if (!found || found.password !== password) {
      return { ok: false, error: 'Invalid email or password' }
    }
    setRememberedEmail(remember ? found.email : '')
    const session = toSession(found)
    setSession(session)
    setUser(session)
    setLoggedOut(false)
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
    setLoggedOut(false)
    return { ok: true }
  }

  const logout = () => {
    clearSession()
    setUser(null)
    setLoggedOut(true)
  }

  return <AuthContext.Provider value={{ user, loggedOut, login, register, logout }}>{children}</AuthContext.Provider>
}
