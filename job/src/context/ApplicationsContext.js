import { createContext } from 'react'

/**
 * All job applications and the actions on them.
 * Value: { applications, loadState: 'loading' | 'error' | 'ready', error, reload(),
 *          apply(data), updateStatus(id, status, note), withdraw(id, reason) }
 * Provided by <ApplicationsProvider>, read with useApplications().
 */
export const ApplicationsContext = createContext(null)
