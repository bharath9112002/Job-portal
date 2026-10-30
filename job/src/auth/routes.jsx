import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { homeFor, redirectAfterLogin } from './roles'

/**
 * Only lets logged-in users with one of `roles` through.
 * - Not logged in: go to login, remembering where they were going (except after an explicit Log out).
 * - Wrong role: go to their own portal's home page.
 */
export function ProtectedRoute({ roles, children }) {
  const { user, loggedOut } = useAuth()
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" replace state={loggedOut ? undefined : { from: location.pathname + location.search }} />
  }
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />
  return children
}

/** Sends a logged-in user to their portal's home page (used for unknown URLs). */
export function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />
}

/**
 * Keeps logged-in users away from login/register pages. Right after logging in this redirect
 * races the login form's own navigate(), so both must aim for the page the user originally asked for.
 */
export function PublicOnlyRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (user) return <Navigate to={redirectAfterLogin(user.role, location.state?.from)} replace />
  return children
}

