import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

/** Only lets logged-in users through; otherwise sends them to login and remembers where they were going. */
export function ProtectedRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

/** Keeps logged-in users away from login/register pages. */
export function PublicOnlyRoute({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  return children
}
