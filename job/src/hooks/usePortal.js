import { useAuth } from './useAuth'

/**
 * Paths for pages shared by both portals (Job Search, job view, Saved Jobs), so links stay
 * inside the current user's portal: /search… for admins, /candidate/jobs… for candidates.
 */
export function usePortal() {
  const { user } = useAuth()
  const isCandidate = user?.role === 'candidate'
  return {
    isCandidate,
    jobsPath: isCandidate ? '/candidate/jobs' : '/search',
    savedPath: isCandidate ? '/candidate/saved' : '/saved',
  }
}
