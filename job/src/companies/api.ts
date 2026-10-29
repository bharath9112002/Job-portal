import type { Company, CompanyInput } from './types'

/*
 * Companies come from the DummyJSON users API (https://dummyjson.com/docs/users):
 * each user record carries a `company` (name, department, address) and a contact email.
 *
 * DummyJSON accepts POST/PUT/DELETE but never persists them, so every change is also
 * recorded in localStorage and replayed over the API data on each load.
 */

const BASE_URL = 'https://dummyjson.com'
const CHANGES_KEY = 'jobportal_company_changes'
const USER_FIELDS = 'firstName,lastName,email,company'

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
  
}

interface ApiUser {
  id: number
  firstName: string
  lastName: string
  email: string
  company: {
    name: string
    department: string
    title: string
    address: { city: string; state: string; country: string }
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(BASE_URL + path, {
      ...init,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    throw new ApiError('Could not reach the server. Check your internet connection and try again.')
  }
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(body?.message ?? `Request failed with status ${res.status}`, res.status)
  }
  return body as T
}

/* ---------- Mapping API users → companies ---------- */

const LOGO_COLORS = ['4f46e5', '0891b2', '059669', 'd97706', 'dc2626', '7c3aed', 'db2777', '2563eb']
const EMPLOYEE_SIZES = [18, 42, 85, 140, 260, 520, 980, 1800, 4200, 9600]

function initials(name: string) {
  const words = name.match(/[A-Za-z]+/g) ?? ['?']
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

/** A generated logo image (DummyJSON's placeholder image service). */
export function logoUrl(name: string, seed: number) {
  const color = LOGO_COLORS[seed % LOGO_COLORS.length]
  return `${BASE_URL}/image/128x128/${color}/ffffff?text=${encodeURIComponent(initials(name))}&fontSize=48&fontFamily=poppins`
}

export function websiteFor(name: string) {
  return `https://www.${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`
}

// The API has no website, headcount, logo or description, so those are derived
// deterministically from the real fields — the same company always gets the same values.
function toCompany(user: ApiUser): Company {
  const { company } = user
  const { city, state } = company.address
  return {
    id: user.id,
    logo: logoUrl(company.name, user.id),
    name: company.name,
    industry: company.department,
    location: `${city}, ${state}`,
    website: websiteFor(company.name),
    email: user.email,
    employees: EMPLOYEE_SIZES[user.id % EMPLOYEE_SIZES.length] + ((user.id * 37) % 50),
    description:
      `${company.name} is a ${company.department.toLowerCase()} company headquartered in ${city}, ${state}. ` +
      `Reach out to ${user.firstName} ${user.lastName} (${company.title}) to learn about open roles and partnership opportunities.`,
  }
}

/** The shape DummyJSON expects when writing a user/company. */
function toUserPayload(data: CompanyInput) {
  const [city, ...rest] = data.location.split(',')
  return {
    email: data.email,
    company: {
      name: data.name,
      department: data.industry,
      address: { city: city.trim(), state: rest.join(',').trim() },
    },
  }
}

/* ---------- Local change log ---------- */

interface Changes {
  added: Company[]
  updated: Record<number, Company>
  deleted: number[]
}

function readChanges(): Changes {
  try {
    const raw = localStorage.getItem(CHANGES_KEY)
    if (raw) return JSON.parse(raw) as Changes
  } catch {
    // fall through
  }
  return { added: [], updated: {}, deleted: [] }
}

function writeChanges(changes: Changes) {
  try {
    localStorage.setItem(CHANGES_KEY, JSON.stringify(changes))
  } catch {
    // Storage blocked: changes last until the page reloads.
  }
}

const isLocalId = (id: number, changes: Changes) => changes.added.some((c) => c.id === id)

/* ---------- Public API ---------- */

let apiCache: Company[] | null = null

export async function fetchCompanies(): Promise<Company[]> {
  if (!apiCache) {
    const data = await request<{ users: ApiUser[] }>(`/users?limit=0&select=${USER_FIELDS}`)
    // Several users work at the same company; keep the first record for each name.
    const seen = new Set<string>()
    apiCache = data.users
      .filter((u) => !seen.has(u.company.name) && !!seen.add(u.company.name))
      .map(toCompany)
  }
  const changes = readChanges()
  return [
    ...apiCache
      .filter((c) => !changes.deleted.includes(c.id))
      .map((c) => changes.updated[c.id] ?? c),
    ...changes.added,
  ]
}

export async function fetchCompany(id: number): Promise<Company> {
  const changes = readChanges()
  const local = changes.added.find((c) => c.id === id) ?? changes.updated[id]
  if (local) return local
  if (changes.deleted.includes(id)) throw new ApiError('This company has been deleted.', 404)
  if (!Number.isInteger(id) || id <= 0) throw new ApiError('Company not found.', 404)
  const user = await request<ApiUser>(`/users/${id}?select=${USER_FIELDS}`)
  return toCompany(user)
}

export async function createCompany(data: CompanyInput): Promise<Company> {
  await request('/users/add', { method: 'POST', body: JSON.stringify(toUserPayload(data)) })
  // DummyJSON always answers with id 209, so assign our own unique id.
  const company: Company = { ...data, id: Date.now() }
  const changes = readChanges()
  changes.added.push(company)
  writeChanges(changes)
  return company
}

export async function updateCompany(id: number, data: CompanyInput): Promise<Company> {
  const changes = readChanges()
  const company: Company = { ...data, id }
  if (isLocalId(id, changes)) {
    // Companies added here don't exist on DummyJSON, so there's nothing to PUT.
    changes.added = changes.added.map((c) => (c.id === id ? company : c))
  } else {
    await request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(toUserPayload(data)) })
    changes.updated[id] = company
  }
  writeChanges(changes)
  return company
}

export async function deleteCompany(id: number): Promise<void> {
  const changes = readChanges()
  if (isLocalId(id, changes)) {
    changes.added = changes.added.filter((c) => c.id !== id)
  } else {
    await request(`/users/${id}`, { method: 'DELETE' })
    changes.deleted.push(id)
    delete changes.updated[id]
  }
  writeChanges(changes)
}
