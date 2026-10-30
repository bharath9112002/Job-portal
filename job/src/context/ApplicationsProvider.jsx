import { useEffect, useMemo, useState } from 'react'
import {
  APPLICATIONS_KEY,
  createApplication,
  fetchApplications,
  updateApplicationStatus,
  withdrawApplication,
} from '../applications/api'
import { ApplicationsContext } from './ApplicationsContext'

export function ApplicationsProvider({ children }) {
  const [applications, setApplications] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchApplications()
      .then((data) => {
        if (cancelled) return
        setApplications(data)
        setLoadState('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  // Another tab (e.g. a candidate applying) changed the applications: pick up the new data.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== APPLICATIONS_KEY) return
      fetchApplications()
        .then((data) => {
          setApplications(data)
          setLoadState('ready')
        })
        .catch(() => {})
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo(() => {
    const replace = (updated) => setApplications((list) => list.map((a) => (a.id === updated.id ? updated : a)))
    return {
      applications,
      loadState,
      error,
      reload: () => {
        setLoadState('loading')
        setReloadKey((k) => k + 1)
      },
      apply: async (data) => {
        const created = await createApplication(data)
        setApplications((list) => [...list, created])
        return created
      },
      updateStatus: async (id, status, note) => {
        const updated = await updateApplicationStatus(id, status, note)
        replace(updated)
        return updated
      },
      withdraw: async (id, reason) => {
        const updated = await withdrawApplication(id, reason)
        replace(updated)
        return updated
      },
    }
  }, [applications, loadState, error])

  return <ApplicationsContext.Provider value={value}>{children}</ApplicationsContext.Provider>
}
