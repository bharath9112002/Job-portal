import { createContext } from 'react'

/**
 * Jobs bookmarked by the logged-in user.
 * Value: { saved: { jobId, savedAt }[], isSaved(jobId), toggle(jobId), remove(jobId), storageError }
 * Provided by <SavedJobsProvider>, read with useSavedJobs().
 */
export const SavedJobsContext = createContext(null)
