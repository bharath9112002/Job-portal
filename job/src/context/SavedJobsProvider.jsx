import { useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { loadSavedJobs, storeSavedJobs } from '../saved/storage'
import { SavedJobsContext } from './SavedJobsContext'

/** Saved jobs belong to the logged-in user, so the list is reloaded whenever the user changes. */
export function SavedJobsProvider({ children }) {
  const { user } = useAuth()
  const email = user?.email ?? ''

  const [state, setState] = useState(() => ({ email, saved: loadSavedJobs(email), storageError: false }))
  // Switch to the new user's list during render (React's "adjust state when a prop changes" pattern).
  if (state.email !== email) {
    setState({ email, saved: loadSavedJobs(email), storageError: false })
  }

  const value = useMemo(() => {
    const { saved } = state
    const commit = (next) => setState({ email, saved: next, storageError: !storeSavedJobs(email, next) })
    const isSaved = (jobId) => saved.some((s) => s.jobId === jobId)
    const remove = (jobId) => commit(saved.filter((s) => s.jobId !== jobId))
    return {
      saved,
      storageError: state.storageError,
      isSaved,
      remove,
      toggle: (jobId) =>
        isSaved(jobId) ? remove(jobId) : commit([{ jobId, savedAt: new Date().toISOString() }, ...saved]),
    }
  }, [state, email])

  return <SavedJobsContext.Provider value={value}>{children}</SavedJobsContext.Provider>
}
