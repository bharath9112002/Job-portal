import { seedCandidates } from './seed'

/*
 * Candidate profiles are stored in localStorage, like jobs. The functions are async and
 * throw on failure so pages treat them like a real API; a backend only needs this file changed.
 */

const CANDIDATES_KEY = 'jobportal_candidates'

export class CandidateError extends Error {
  constructor(message, status, field) {
    super(message)
    this.status = status
    /** Form field the error belongs to, if any (e.g. a duplicate email). */
    this.field = field
  }
}

function load() {
  let raw
  try {
    raw = localStorage.getItem(CANDIDATES_KEY)
  } catch {
    throw new CandidateError('Browser storage is unavailable, so candidates cannot be loaded.')
  }
  if (raw === null) {
    const seeded = seedCandidates()
    save(seeded)
    return seeded
  }
  try {
    return JSON.parse(raw)
  } catch {
    throw new CandidateError('Saved candidate data is corrupted. Clear site data to reset it.')
  }
}

function save(candidates) {
  try {
    localStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates))
  } catch {
    throw new CandidateError('Could not save — browser storage is full. Try a smaller profile photo.')
  }
}

function assertEmailFree(candidates, email, exceptId) {
  const taken = candidates.some((c) => c.id !== exceptId && c.email.toLowerCase() === email.toLowerCase())
  if (taken) throw new CandidateError('Another candidate already uses this email.', 409, 'email')
}

export async function fetchCandidates() {
  return load()
}

export async function fetchCandidate(id) {
  const candidate = load().find((c) => c.id === id)
  if (!candidate) throw new CandidateError('This candidate profile does not exist.', 404)
  return candidate
}

export async function createCandidate(data) {
  const candidates = load()
  assertEmailFree(candidates, data.email)
  const now = new Date().toISOString()
  const candidate = { ...data, id: Math.max(0, ...candidates.map((c) => c.id)) + 1, createdAt: now, updatedAt: now }
  save([...candidates, candidate])
  return candidate
}

export async function updateCandidate(id, data) {
  const candidates = load()
  const existing = candidates.find((c) => c.id === id)
  if (!existing) throw new CandidateError('This candidate profile does not exist.', 404)
  assertEmailFree(candidates, data.email, id)
  const candidate = { ...existing, ...data, updatedAt: new Date().toISOString() }
  save(candidates.map((c) => (c.id === id ? candidate : c)))
  return candidate
}

/** The profile linked to a candidate account (same email), or null if they haven't created one yet. */
export async function fetchCandidateByEmail(email) {
  return load().find((c) => c.email.toLowerCase() === email.toLowerCase()) ?? null
}
