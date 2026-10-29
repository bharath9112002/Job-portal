/**
 * @typedef {'open' | 'closed'} JobStatus
 *
 * @typedef {Object} Job
 * @property {number} id
 * @property {string} title
 * @property {number} companyId
 * @property {string} companyName
 * @property {string} category
 * @property {string} employmentType
 * @property {string} experienceLevel
 * @property {number} salaryMin     Annual salary in USD
 * @property {number} salaryMax     Annual salary in USD
 * @property {string} location
 * @property {string[]} skills
 * @property {string} deadline      ISO date (YYYY-MM-DD)
 * @property {JobStatus} status
 * @property {string} postedAt      ISO timestamp
 */

export const JOB_CATEGORIES = [
  'Software Development',
  'Data & Analytics',
  'Design',
  'Product Management',
  'Marketing',
  'Sales',
  'Customer Support',
  'Finance & Accounting',
  'Human Resources',
  'Operations',
  'Legal',
]

export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']

export const EXPERIENCE_LEVELS = [
  'Entry level (0–2 yrs)',
  'Mid level (2–5 yrs)',
  'Senior (5–8 yrs)',
  'Lead (8+ yrs)',
  'Executive',
]

export const SKILL_SUGGESTIONS = [
  'React',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Python',
  'Java',
  'SQL',
  'AWS',
  'Docker',
  'Kubernetes',
  'Figma',
  'UI Design',
  'UX Research',
  'Excel',
  'Power BI',
  'Tableau',
  'Machine Learning',
  'Communication',
  'Leadership',
  'SEO',
  'Content Writing',
  'Salesforce',
  'Negotiation',
  'Agile',
  'Git',
  'REST APIs',
  'GraphQL',
  'Go',
  'C#',
  'Accounting',
]

/** "$85k – $120k" */
export function formatSalary(min, max) {
  const k = (n) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`)
  return min === max ? k(min) : `${k(min)} – ${k(max)}`
}

export function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function isPastDeadline(deadline) {
  return deadline < todayIso()
}

export function formatDate(iso) {
  return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** "Today", "Yesterday", "5 days ago", "3 weeks ago" */
export function postedAgo(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? '' : 's'} ago`
  return `${Math.floor(days / 30)} month${days < 60 ? '' : 's'} ago`
}

/** Open and still accepting applications. */
export function isAcceptingApplications(job) {
  return job.status === 'open' && !isPastDeadline(job.deadline)
}
