import { isActive } from './model'
import { seedApplications } from './seed'

/*
 * Applications are stored in localStorage, like jobs and candidates. The functions are async
 * and throw on failure so callers treat them like a real API.
 */

export const APPLICATIONS_KEY = 'jobportal_applications'

export class ApplicationError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function load() {
  let raw
  try {
    raw = localStorage.getItem(APPLICATIONS_KEY)
  } catch {
    throw new ApplicationError('Browser storage is unavailable, so applications cannot be loaded.')
  }
  if (raw === null) {
    const seeded = seedApplications()
    save(seeded)
    return seeded
  }
  try {
    return JSON.parse(raw)
  } catch {
    throw new ApplicationError('Saved application data is corrupted. Clear site data to reset it.')
  }
}

function save(applications) {
  try {
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications))
  } catch {
    throw new ApplicationError('Could not save — browser storage is full or blocked.')
  }
}

function change(id, status, note) {
  const applications = load()
  const existing = applications.find((a) => a.id === id)
  if (!existing) throw new ApplicationError('This application no longer exists.', 404)
  if (existing.status === 'withdrawn') throw new ApplicationError('This application was withdrawn and can’t be changed.')
  const at = new Date().toISOString()
  const updated = { ...existing, status, updatedAt: at, history: [...existing.history, { status, at, note }] }
  save(applications.map((a) => (a.id === id ? updated : a)))
  return updated
}

export async function fetchApplications() {
  return load()
}

/** `data`: job and candidate snapshot plus an optional cover letter. */
export async function createApplication(data) {
  const applications = load()
  const duplicate = applications.find(
    (a) => a.jobId === data.jobId && a.candidateId === data.candidateId && a.status !== 'withdrawn',
  )
  if (duplicate) throw new ApplicationError(`${data.candidateName} has already applied for this job.`, 409)
  const at = new Date().toISOString()
  const application = {
    ...data,
    id: Math.max(0, ...applications.map((a) => a.id)) + 1,
    status: 'applied',
    appliedAt: at,
    updatedAt: at,
    history: [{ status: 'applied', at, note: '' }],
  }
  save([...applications, application])
  return application
}

export async function updateApplicationStatus(id, status, note = '') {
  return change(id, status, note)
}

/** UI-only withdraw: marks the application as withdrawn; nothing is sent to the employer. */
export async function withdrawApplication(id, reason = '') {
  const existing = load().find((a) => a.id === id)
  if (existing && !isActive(existing.status)) {
    throw new ApplicationError('Only applications that are still in progress can be withdrawn.')
  }
  return change(id, 'withdrawn', reason || 'Withdrawn by candidate.')
}
