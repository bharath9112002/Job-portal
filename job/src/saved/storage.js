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

/** Total saved jobs across every user on this browser (for the admin dashboard). */
export function countAllSavedJobs() {
  let total = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('jobportal_saved_jobs:')) total += JSON.parse(localStorage.getItem(key) || '[]').length
    }
  } catch {
    // ignore unreadable entries
  }
  return total
}
