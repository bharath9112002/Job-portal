import { useEffect, useState } from 'react'
import { fetchCandidateByEmail } from '../candidates/api'
import { useAuth } from './useAuth'

/**
 * The logged-in candidate's own profile (linked by email).
 * Returns { profile (null if not created yet), loadState, error, reload }.
 * For non-candidate users it stays { profile: null, loadState: 'ready' } without loading anything.
 */
export function useMyProfile() {
  const { user } = useAuth()
  const email = user?.role === 'candidate' ? user.email : ''
  const [state, setState] = useState({ loadState: email ? 'loading' : 'ready', profile: null, error: '' })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!email) return
    let cancelled = false
    fetchCandidateByEmail(email)
      .then((profile) => !cancelled && setState({ loadState: 'ready', profile, error: '' }))
      .catch((err) => !cancelled && setState({ loadState: 'error', profile: null, error: err.message }))
    return () => {
      cancelled = true
    }
  }, [email, reloadKey])

  return {
    ...state,
    reload: () => {
      setState((s) => ({ ...s, loadState: 'loading' }))
      setReloadKey((k) => k + 1)
    },
  }
}
