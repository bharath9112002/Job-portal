/**
 * @typedef {Object} Experience
 * @property {string} id
 * @property {string} title
 * @property {string} company
 * @property {string} startDate   "YYYY-MM"
 * @property {string} endDate     "YYYY-MM", or '' when current
 * @property {boolean} current
 * @property {string} description
 *
 * @typedef {Object} Education
 * @property {string} id
 * @property {string} degree
 * @property {string} fieldOfStudy
 * @property {string} institution
 * @property {string} startYear
 * @property {string} endYear
 * @property {string} grade
 *
 * @typedef {Object} ResumeInfo   Metadata only — resume upload is UI-only, the file itself isn't stored.
 * @property {string} name
 * @property {number} size        Bytes
 * @property {string} addedAt     ISO timestamp
 *
 * @typedef {Object} Candidate
 * @property {number} id
 * @property {string} fullName
 * @property {string} email
 * @property {string} mobile
 * @property {{ line: string, city: string, state: string, postalCode: string }} address
 * @property {string[]} skills
 * @property {Experience[]} experience
 * @property {Education[]} education
 * @property {ResumeInfo | null} resume
 * @property {string} photo       Resized image as a data URL, or ''
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export const DEGREE_SUGGESTIONS = [
  'B.Tech', 'B.E.', 'B.Sc', 'B.Com', 'BBA', 'BCA', 'B.A.',
  'M.Tech', 'M.E.', 'M.Sc', 'M.Com', 'MBA', 'MCA', 'M.A.',
  'Diploma', 'Higher Secondary (12th)', 'Ph.D',
]

let idCounter = 0
/** Stable keys for repeatable rows in the form. */
export const newRowId = () => `${Date.now().toString(36)}-${(idCounter++).toString(36)}`

export const emptyExperience = () => ({
  id: newRowId(),
  title: '',
  company: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
})

export const emptyEducation = () => ({
  id: newRowId(),
  degree: '',
  fieldOfStudy: '',
  institution: '',
  startYear: '',
  endYear: '',
  grade: '',
})

export function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const monthIndex = (ym) => {
  const [y, m] = ym.split('-').map(Number)
  return y * 12 + (m - 1)
}

/** "2024-03" → "Mar 2024" */
export function formatMonth(ym) {
  if (!ym) return ''
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

/** 27 → "2 yrs 3 mos" */
export function formatDuration(months) {
  if (months <= 0) return 'Less than a month'
  const y = Math.floor(months / 12)
  const m = months % 12
  return [y && `${y} yr${y > 1 ? 's' : ''}`, m && `${m} mo${m > 1 ? 's' : ''}`].filter(Boolean).join(' ')
}

/** Months covered by one role, counting both the start and end month. */
export function roleMonths(exp) {
  const end = exp.current || !exp.endDate ? currentMonth() : exp.endDate
  return monthIndex(end) - monthIndex(exp.startDate) + 1
}

/** Total experience in months; overlapping roles are only counted once. */
export function totalExperienceMonths(experience) {
  const ranges = experience
    .filter((e) => e.startDate)
    .map((e) => [monthIndex(e.startDate), monthIndex(e.current || !e.endDate ? currentMonth() : e.endDate)])
    .sort((a, b) => a[0] - b[0])
  let total = 0
  let [curStart, curEnd] = [null, null]
  for (const [s, e] of ranges) {
    if (curEnd === null || s > curEnd + 1) {
      if (curEnd !== null) total += curEnd - curStart + 1
      ;[curStart, curEnd] = [s, e]
    } else {
      curEnd = Math.max(curEnd, e)
    }
  }
  if (curEnd !== null) total += curEnd - curStart + 1
  return total
}

/** The role shown as the candidate's headline: a current one, otherwise the most recent. */
export function latestRole(experience) {
  return [...experience].sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1
    return (b.endDate || b.startDate).localeCompare(a.endDate || a.startDate)
  })[0]
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
