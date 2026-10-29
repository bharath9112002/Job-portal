import { validateEmail, validateName } from '../auth/validation'
import { currentMonth } from './model'

const MOBILE_RE = /^(\+\d{1,3})?\d{10}$/
const POSTAL_RE = /^[A-Za-z0-9 -]{3,10}$/
const YEAR_RE = /^\d{4}$/

export function validateMobile(mobile) {
  const digits = mobile.replace(/[\s()-]/g, '')
  if (!digits) return 'Mobile number is required'
  if (!MOBILE_RE.test(digits)) return 'Enter a 10-digit mobile number (country code optional)'
}

const required = (value, message) => (value.trim() ? undefined : message)

/**
 * Validates the whole profile form. Returns a flat map of field keys to messages, e.g.
 * { email: '…', 'experience.0.title': '…', 'education.1.endYear': '…' }; empty when valid.
 */
export function validateCandidate(v) {
  const errors = {}
  const set = (key, message) => {
    if (message) errors[key] = message
  }
  const thisMonth = currentMonth()
  const thisYear = new Date().getFullYear()

  set('fullName', validateName(v.fullName))
  set('email', validateEmail(v.email))
  set('mobile', validateMobile(v.mobile))

  set('address.line', required(v.address.line, 'Address is required'))
  set('address.city', required(v.address.city, 'City is required'))
  set('address.state', required(v.address.state, 'State is required'))
  set(
    'address.postalCode',
    !v.address.postalCode.trim()
      ? 'Postal code is required'
      : !POSTAL_RE.test(v.address.postalCode.trim())
        ? 'Enter a valid postal code'
        : undefined,
  )

  set('skills', v.skills.length ? undefined : 'Add at least one skill')

  v.experience.forEach((e, i) => {
    const k = (f) => `experience.${i}.${f}`
    set(k('title'), required(e.title, 'Job title is required'))
    set(k('company'), required(e.company, 'Company is required'))
    set(k('startDate'), !e.startDate ? 'Start date is required' : e.startDate > thisMonth ? "Can't be in the future" : undefined)
    if (!e.current) {
      set(
        k('endDate'),
        !e.endDate
          ? 'End date is required (or tick "I currently work here")'
          : e.endDate > thisMonth
            ? "Can't be in the future"
            : e.startDate && e.endDate < e.startDate
              ? 'Must be after the start date'
              : undefined,
      )
    }
    set(k('description'), e.description.length > 500 ? 'Keep it under 500 characters' : undefined)
  })

  if (!v.education.length) set('education', 'Add at least one education entry')
  v.education.forEach((e, i) => {
    const k = (f) => `education.${i}.${f}`
    set(k('degree'), required(e.degree, 'Degree is required'))
    set(k('institution'), required(e.institution, 'Institution is required'))
    const start = Number(e.startYear)
    const end = Number(e.endYear)
    set(
      k('startYear'),
      !e.startYear
        ? 'Start year is required'
        : !YEAR_RE.test(e.startYear) || start < 1950 || start > thisYear
          ? `Enter a year between 1950 and ${thisYear}`
          : undefined,
    )
    set(
      k('endYear'),
      !e.endYear
        ? 'End year is required (expected year if ongoing)'
        : !YEAR_RE.test(e.endYear) || end < 1950 || end > thisYear + 6
          ? `Enter a year between 1950 and ${thisYear + 6}`
          : YEAR_RE.test(e.startYear) && end < start
            ? 'Must be the same as or after the start year'
            : undefined,
    )
  })

  return errors
}
