/**
 * @typedef {'applied' | 'review' | 'shortlisted' | 'interview' | 'offered' | 'hired' | 'rejected' | 'withdrawn'} ApplicationStatus
 *
 * @typedef {Object} StatusChange
 * @property {ApplicationStatus} status
 * @property {string} at      ISO timestamp
 * @property {string} note
 *
 * @typedef {Object} Application
 * @property {number} id
 * @property {number} jobId
 * @property {string} jobTitle        Copied at apply time, so the record survives the job being deleted
 * @property {number} companyId
 * @property {string} companyName
 * @property {number} candidateId
 * @property {string} candidateName
 * @property {string} candidateEmail
 * @property {string} coverLetter
 * @property {ApplicationStatus} status
 * @property {string} appliedAt
 * @property {string} updatedAt
 * @property {StatusChange[]} history  Oldest first
 */

/** Label and colour tone for each status. Tones map to CSS classes (app-status.<tone>). */
export const STATUSES = {
  applied: { label: 'Applied', tone: 'info' },
  review: { label: 'Under review', tone: 'info' },
  shortlisted: { label: 'Shortlisted', tone: 'info' },
  interview: { label: 'Interview', tone: 'warning' },
  offered: { label: 'Offered', tone: 'success' },
  hired: { label: 'Hired', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  withdrawn: { label: 'Withdrawn', tone: 'muted' },
}

/** Statuses an admin can move an application to, in pipeline order. */
export const PIPELINE = ['applied', 'review', 'shortlisted', 'interview', 'offered', 'hired', 'rejected']

/** In progress — not yet hired, rejected or withdrawn. */
export const isActive = (status) => !['hired', 'rejected', 'withdrawn'].includes(status)

export const canWithdraw = (application) => isActive(application.status)
