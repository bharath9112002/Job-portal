/**
 * @typedef {Object} StoredUser
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} password
 * @property {'admin'} role
 * @property {string} createdAt
 *
 * The logged-in user, as kept in the session key (never includes the password):
 * @typedef {Omit<StoredUser, 'password'> & { loggedInAt: string }} SessionUser
 */

const USERS_KEY = 'jobportal_users'
const SESSION_KEY = 'jobportal_session'

// The demo account is always available so the app can be tried without registering.
export const DEMO_ACCOUNTS = [
  {
    id: 'demo-admin',
    name: 'Demo Admin',
    email: 'admin@demo.com',
    password: 'Admin@123',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked — the app keeps working for this tab only.
  }
}

/** Registered users plus any demo accounts that haven't been overridden. */
export function getUsers() {
  const users = readJson(USERS_KEY, [])
  const emails = new Set(users.map((u) => u.email))
  return [...users, ...DEMO_ACCOUNTS.filter((d) => !emails.has(d.email))]
}

export function findUserByEmail(email) {
  const target = email.trim().toLowerCase()
  return getUsers().find((u) => u.email.toLowerCase() === target)
}

export function saveUser(user) {
  const users = readJson(USERS_KEY, [])
  writeJson(USERS_KEY, [...users, user])
}

export function getSession() {
  return readJson(SESSION_KEY, null)
}

export function setSession(user) {
  writeJson(SESSION_KEY, user)
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}
