export interface Company {
  id: number
  logo: string
  name: string
  industry: string
  location: string
  website: string
  email: string
  employees: number
  description: string
}

export type CompanyInput = Omit<Company, 'id'>

export const INDUSTRIES = [
  'Accounting',
  'Business Development',
  'Engineering',
  'Human Resources',
  'Legal',
  'Marketing',
  'Product Management',
  'Research and Development',
  'Sales',
  'Services',
  'Support',
  'Training',
]
