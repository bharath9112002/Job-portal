/*
 * Saved jobs are kept per logged-in user: { jobId, savedAt }[] under a key that includes their email.
 */

const keyFor = (email) => `jobportal_saved_jobs:${email.toLowerCase()}`

export function loadSavedJobs(email) {
  if (!email) return []
  try {
    const raw = localStorage.getItem(keyFor(email))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/** Returns false if the browser refused to store it (the change still applies for this session). */
export function storeSavedJobs(email, entries) {
  if (!email) return false
  try {
    localStorage.setItem(keyFor(email), JSON.stringify(entries))
    return true
  } catch {
    return false
  }
}
