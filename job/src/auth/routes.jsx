import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * Only lets logged-in users through; otherwise sends them to login and remembers where they were going
 * (except after an explicit Log out — then the next login starts at the dashboard).
 */
export function ProtectedRoute({ children }) {
  const { user, loggedOut } = useAuth()
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" replace state={loggedOut ? undefined : { from: location.pathname + location.search }} />
  }
  return children
}

/**
 * Keeps logged-in users away from login/register pages. Right after logging in this redirect
 * races the login form's own navigate(), so both must aim for the page the user originally asked for.
 */
export function PublicOnlyRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (user) return <Navigate to={location.state?.from ?? '/dashboard'} replace />
  return children
}
