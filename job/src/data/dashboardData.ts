// Static demo data for the admin dashboard. Replace with API calls once a backend exists.

export type IconName =
  | 'building'
  | 'briefcase'
  | 'bolt'
  | 'users'
  | 'file'
  | 'bookmark'
  | 'plus'
  | 'grid'
  | 'check'
  | 'x'
  | 'calendar'
  | 'logout'
  | 'menu'

export interface Stat {
  id: string
  label: string
  value: number
  /** Percent change vs. last month. */
  change: number
  icon: IconName
}

export const STATS: Stat[] = [
  { id: 'companies', label: 'Total Companies', value: 248, change: 8.2, icon: 'building' },
  { id: 'jobs', label: 'Total Jobs', value: 1356, change: 12.5, icon: 'briefcase' },
  { id: 'active', label: 'Active Job Postings', value: 842, change: 4.1, icon: 'bolt' },
  { id: 'candidates', label: 'Total Candidates', value: 12480, change: 15.3, icon: 'users' },
  { id: 'applications', label: 'Total Applications', value: 28765, change: 9.7, icon: 'file' },
  { id: 'saved', label: 'Saved Jobs', value: 5320, change: -2.4, icon: 'bookmark' },
]

export interface Point {
  label: string
  value: number
}

/** Applications received per month, last 12 months. */
export const APPLICATIONS_BY_MONTH: Point[] = [
  { label: 'Nov', value: 1820 },
  { label: 'Dec', value: 1540 },
  { label: 'Jan', value: 2110 },
  { label: 'Feb', value: 2290 },
  { label: 'Mar', value: 2480 },
  { label: 'Apr', value: 2350 },
  { label: 'May', value: 2620 },
  { label: 'Jun', value: 2540 },
  { label: 'Jul', value: 2760 },
  { label: 'Aug', value: 2930 },
  { label: 'Sep', value: 2680 },
  { label: 'Oct', value: 2645 },
]

/** Where all applications currently sit in the hiring pipeline. */
export const APPLICATION_PIPELINE: Point[] = [
  { label: 'Applied', value: 14820 },
  { label: 'Screening', value: 6940 },
  { label: 'Interview', value: 4180 },
  { label: 'Offered', value: 1625 },
  { label: 'Hired', value: 1200 },
]

/** Active postings by job category. */
export const JOBS_BY_CATEGORY: Point[] = [
  { label: 'Engineering', value: 312 },
  { label: 'Sales & Marketing', value: 168 },
  { label: 'Design', value: 104 },
  { label: 'Finance', value: 92 },
  { label: 'Operations', value: 87 },
  { label: 'Other', value: 79 },
]

export interface Activity {
  id: number
  icon: IconName
  text: string
  detail: string
  minutesAgo: number
}

export const RECENT_ACTIVITIES: Activity[] = [
  { id: 1, icon: 'briefcase', text: 'New job posted', detail: 'Senior React Developer · Nimbus Labs', minutesAgo: 12 },
  { id: 2, icon: 'users', text: 'New candidate registered', detail: 'Priya Sharma · Data Analyst', minutesAgo: 34 },
  { id: 3, icon: 'file', text: 'Application received', detail: 'UX Designer · Brightwave Studio', minutesAgo: 58 },
  { id: 4, icon: 'building', text: 'Company verified', detail: 'Orbit Fintech Pvt Ltd', minutesAgo: 95 },
  { id: 5, icon: 'calendar', text: 'Interview scheduled', detail: 'Backend Engineer · Kavya Iyer', minutesAgo: 180 },
  { id: 6, icon: 'check', text: 'Candidate hired', detail: 'Product Manager · Arjun Mehta', minutesAgo: 320 },
  { id: 7, icon: 'x', text: 'Job posting closed', detail: 'QA Engineer · TestRight Solutions', minutesAgo: 1440 },
]

export interface QuickAction {
  id: string
  icon: IconName
  title: string
  description: string
}

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'post-job', icon: 'plus', title: 'Post a Job', description: 'Create a new job listing' },
  { id: 'add-company', icon: 'building', title: 'Add Company', description: 'Register a new employer' },
  { id: 'candidates', icon: 'users', title: 'View Candidates', description: 'Browse candidate profiles' },
  { id: 'applications', icon: 'file', title: 'Review Applications', description: 'Screen pending applications' },
]
