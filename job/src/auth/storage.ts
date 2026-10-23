export type Role = 'admin'

export interface StoredUser {
  id: string
  name: string
  email: string
  password: string
  role: Role
  createdAt: string
}

/** The logged-in user, as kept in the session key (never includes the password). */
export type SessionUser = Omit<StoredUser, 'password'> & { loggedInAt: string }

const USERS_KEY = 'jobportal_users'
const SESSION_KEY = 'jobportal_session'

// The demo account is always available so the app can be tried without registering.
export const DEMO_ACCOUNTS: StoredUser[] = [
  {
    id: 'demo-admin',
    name: 'Demo Admin',
    email: 'admin@demo.com',
    password: 'Admin@123',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked — the app keeps working for this tab only.
  }
}

/** Registered users plus any demo accounts that haven't been overridden. */
export function getUsers(): StoredUser[] {
  const users = readJson<StoredUser[]>(USERS_KEY, [])
  const emails = new Set(users.map((u) => u.email))
  return [...users, ...DEMO_ACCOUNTS.filter((d) => !emails.has(d.email))]
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const target = email.trim().toLowerCase()
  return getUsers().find((u) => u.email.toLowerCase() === target)
}

export function saveUser(user: StoredUser) {
  const users = readJson<StoredUser[]>(USERS_KEY, [])
  writeJson(USERS_KEY, [...users, user])
}

export function getSession(): SessionUser | null {
  return readJson<SessionUser | null>(SESSION_KEY, null)
}

export function setSession(user: SessionUser) {
  writeJson(SESSION_KEY, user)
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}
