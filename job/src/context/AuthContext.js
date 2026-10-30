import { createContext } from 'react'

/**
 * The logged-in user and the auth actions.
 * Value: { user, loggedOut, login(email, password, remember), register({ name, email, password }), logout() }
 * `loggedOut` is true after an explicit Log out (as opposed to never having logged in).
 * Provided by <AuthProvider>, read with useAuth().
 */
export const AuthContext = createContext(null)
