export type JobStatus = 'open' | 'closed'

export interface Job {
  id: number
  title: string
  companyId: number
  companyName: string
  category: string
  employmentType: string
  experienceLevel: string
  /** Annual salary in USD. */
  salaryMin: number
  salaryMax: number
  location: string
  skills: string[]
  /** ISO date (YYYY-MM-DD). */
  deadline: string
  status: JobStatus
  postedAt: string
}

export type JobInput = Omit<Job, 'id' | 'postedAt'>

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
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'SQL', 'AWS', 'Docker',
  'Kubernetes', 'Figma', 'UI Design', 'UX Research', 'Excel', 'Power BI', 'Tableau',
  'Machine Learning', 'Communication', 'Leadership', 'SEO', 'Content Writing', 'Salesforce',
  'Negotiation', 'Agile', 'Git', 'REST APIs', 'GraphQL', 'Go', 'C#', 'Accounting',
]

/** "$85k – $120k" */
export function formatSalary(min: number, max: number) {
  const k = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`)
  return min === max ? k(min) : `${k(min)} – ${k(max)}`
}

export function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function isPastDeadline(deadline: string) {
  return deadline < todayIso()
}

export function formatDate(iso: string) {
  return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
