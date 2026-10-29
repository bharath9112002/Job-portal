import { seedJobs } from './seed'

/*
 * Jobs are stored in localStorage (none of the suggested mock APIs has a jobs resource).
 * The functions are async and throw on failure so pages treat them like a real API,
 * and swapping in a backend later only means changing this file.
 */

const JOBS_KEY = 'jobportal_jobs'

export class JobError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function load() {
  let raw
  try {
    raw = localStorage.getItem(JOBS_KEY)
  } catch {
    throw new JobError('Browser storage is unavailable, so jobs cannot be loaded.')
  }
  if (raw === null) {
    const seeded = seedJobs()
    save(seeded)
    return seeded
  }
  try {
    return JSON.parse(raw)
  } catch {
    throw new JobError('Saved job data is corrupted. Clear site data to reset it.')
  }
}

function save(jobs) {
  try {
    localStorage.setItem(JOBS_KEY, JSON.stringify(jobs))
  } catch {
    throw new JobError('Could not save — browser storage is full or blocked.')
  }
}

export async function fetchJobs() {
  return load()
}

export async function fetchJob(id) {
  const job = load().find((j) => j.id === id)
  if (!job) throw new JobError('This job posting does not exist or was deleted.', 404)
  return job
}

export async function createJob(data) {
  const jobs = load()
  const job = {
    ...data,
    id: Math.max(0, ...jobs.map((j) => j.id)) + 1,
    postedAt: new Date().toISOString(),
  }
  save([...jobs, job])
  return job
}

export async function updateJob(id, data) {
  const jobs = load()
  const existing = jobs.find((j) => j.id === id)
  if (!existing) throw new JobError('This job posting does not exist or was deleted.', 404)
  const job = { ...existing, ...data }
  save(jobs.map((j) => (j.id === id ? job : j)))
  return job
}

export async function setJobStatus(id, status) {
  const { id: _id, postedAt: _postedAt, ...rest } = await fetchJob(id)
  return updateJob(id, { ...rest, status })
}

export async function deleteJob(id) {
  const jobs = load()
  if (!jobs.some((j) => j.id === id)) throw new JobError('This job posting was already deleted.', 404)
  save(jobs.filter((j) => j.id !== id))
}
