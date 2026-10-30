// Dummy data for the Reports charts. Replace with real aggregates once a backend exists.

const MONTHLY_VALUES = [1640, 1520, 1985, 2210, 2405, 2290, 2580, 2475, 2730, 2910, 2655, 2840]

/** Applications per month for the 12 months up to and including the current one. */
export function monthlyApplications(today = new Date()) {
  return MONTHLY_VALUES.map((value, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (MONTHLY_VALUES.length - 1 - i), 1)
    return {
      label: d.toLocaleDateString('en-IN', { month: 'short' }),
      fullLabel: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      value,
    }
  })
}

export const APPLICATIONS_BY_STATUS = [
  { label: 'Applied', value: 9420 },
  { label: 'Under review', value: 6130 },
  { label: 'Shortlisted', value: 3870 },
  { label: 'Interview', value: 2240 },
  { label: 'Offered', value: 910 },
  { label: 'Hired', value: 760 },
]

export const JOBS_BY_CATEGORY = [
  { label: 'Software Development', value: 412 },
  { label: 'Data & Analytics', value: 188 },
  { label: 'Sales', value: 164 },
  { label: 'Marketing', value: 131 },
  { label: 'Design', value: 97 },
  { label: 'Customer Support', value: 86 },
  { label: 'Other', value: 121 },
]

export const JOBS_BY_TYPE = [
  { label: 'Full-time', value: 812 },
  { label: 'Contract', value: 164 },
  { label: 'Internship', value: 121 },
  { label: 'Part-time', value: 63 },
  { label: 'Freelance', value: 39 },
]
