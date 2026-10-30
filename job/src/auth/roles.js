/** The two account types and where each one lands after logging in. */
export const ROLES = {
  admin: { label: 'Admin', home: '/dashboard', hint: 'Manage companies, jobs and hiring' },
  candidate: { label: 'Candidate', home: '/candidate', hint: 'Find jobs and track applications' },
}

export const homeFor = (role) => ROLES[role]?.home ?? '/login'

/** Whether a path belongs to the given role's portal (candidate pages live under /candidate). */
export function pathAllowedFor(role, path) {
  const isCandidatePath = path === '/candidate' || path.startsWith('/candidate/')
  return role === 'candidate' ? isCandidatePath : !isCandidatePath
}

/** Where to go after logging in: the requested page if it belongs to this role's portal, else its home. */
export function redirectAfterLogin(role, from) {
  return from && pathAllowedFor(role, from.split('?')[0]) ? from : homeFor(role)
}
