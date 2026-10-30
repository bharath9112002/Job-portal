import { createContext } from 'react'

/**
 * The logged-in user and the auth actions.
 * Value: { user, loggedOut, login(email, password, role, remember), register({ name, email, password, role }), logout() }
 * `user.role` is 'admin' or 'candidate'.
 * `loggedOut` is true after an explicit Log out (as opposed to never having logged in).
 * Provided by <AuthProvider>, read with useAuth().
 */
export const AuthContext = createContext(null)
