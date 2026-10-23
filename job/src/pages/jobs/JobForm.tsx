import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchCompanies } from '../../companies/api'
import type { Company } from '../../companies/types'
import { createJob, fetchJob, updateJob } from '../../jobs/api'
import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  JOB_CATEGORIES,
  SKILL_SUGGESTIONS,
  todayIso,
  type JobInput,
  type JobStatus,
} from '../../jobs/types'
import type { Errors } from '../../auth/validation'
import { AdminLayout } from '../../components/AdminLayout'
import { SelectField, TextField } from '../../components/FormFields'
import { Icon } from '../../components/Icon'
import { SkillsInput } from '../../components/SkillsInput'

interface FormValues {
  title: string
  companyId: string
  category: string
  employmentType: string
  experienceLevel: string
  salaryMin: string
  salaryMax: string
  location: string
  skills: string[]
  deadline: string
  status: JobStatus
}

const EMPTY: FormValues = {
  title: '',
  companyId: '',
  category: '',
  employmentType: '',
  experienceLevel: '',
  salaryMin: '',
  salaryMax: '',
  location: '',
  skills: [],
  deadline: '',
  status: 'open',
}

const MAX_SALARY = 10_000_000

function salaryError(value: string, label: string) {
  if (!value) return `${label} is required`
  const n = Number(value)
  if (!Number.isInteger(n) || n < 0) return 'Enter a whole number'
  if (n > MAX_SALARY) return 'That seems too large'
}

function validate(v: FormValues): Errors<FormValues> {
  const minErr = salaryError(v.salaryMin, 'Minimum salary')
  const maxErr =
    salaryError(v.salaryMax, 'Maximum salary') ??
    (!minErr && Number(v.salaryMax) < Number(v.salaryMin) ? 'Must be at least the minimum' : undefined)
  return {
    title: !v.title.trim() ? 'Job title is required' : v.title.trim().length < 3 ? 'Title must be at least 3 characters' : undefined,
    companyId: v.companyId ? undefined : 'Select a company',
    category: v.category ? undefined : 'Select a category',
    employmentType: v.employmentType ? undefined : 'Select an employment type',
    experienceLevel: v.experienceLevel ? undefined : 'Select an experience level',
    salaryMin: minErr,
    salaryMax: maxErr,
    location: v.location.trim() ? undefined : 'Location is required (or "Remote")',
    skills: v.skills.length ? undefined : 'Add at least one skill',
    deadline: !v.deadline
      ? 'Application deadline is required'
      : v.status === 'open' && v.deadline < todayIso()
        ? 'An open job needs a deadline of today or later'
        : undefined,
  }
}

export default function JobForm() {
  const { id } = useParams()
  const isEdit = id !== undefined
  const navigate = useNavigate()

  const [values, setValues] = useState<FormValues>(EMPTY)
  const [errors, setErrors] = useState<Errors<FormValues>>({})
  const [companies, setCompanies] = useState<Company[]>([])
  /** Name of the job's current company, kept in case that company has since been deleted. */
  const [savedCompanyName, setSavedCompanyName] = useState('')
  const [loadState, setLoadState] = useState<'loading' | 'error' | 'ready'>('loading')
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchCompanies(), isEdit ? fetchJob(Number(id)) : Promise.resolve(null)])
      .then(([companyList, job]) => {
        if (cancelled) return
        setCompanies([...companyList].sort((a, b) => a.name.localeCompare(b.name)))
        if (job) {
          setSavedCompanyName(job.companyName)
          setValues({
            ...job,
            companyId: String(job.companyId),
            salaryMin: String(job.salaryMin),
            salaryMax: String(job.salaryMax),
          })
        }
        setLoadState('ready')
      })
      .catch((err: Error) => {
        if (cancelled) return
        setLoadError(err.message)
        setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [id, isEdit, reloadKey])

  const update = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
    setSaveError('')
  }

  const onCompanyChange = (companyId: string) => {
    update('companyId', companyId)
    // Suggest the company's location if the field is still empty.
    const company = companies.find((c) => String(c.id) === companyId)
    if (company && !values.location.trim()) update('location', company.location)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.values(found).some(Boolean)) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }

    const company = companies.find((c) => String(c.id) === values.companyId)
    const data: JobInput = {
      title: values.title.trim(),
      companyId: Number(values.companyId),
      companyName: company?.name ?? savedCompanyName,
      category: values.category,
      employmentType: values.employmentType,
      experienceLevel: values.experienceLevel,
      salaryMin: Number(values.salaryMin),
      salaryMax: Number(values.salaryMax),
      location: values.location.trim(),
      skills: values.skills,
      deadline: values.deadline,
      status: values.status,
    }

    setSaving(true)
    setSaveError('')
    try {
      const saved = isEdit ? await updateJob(Number(id), data) : await createJob(data)
      navigate(`/jobs/${saved.id}`, {
        replace: true,
        state: { flash: isEdit ? 'Job updated.' : 'Job posted.' },
      })
    } catch (err) {
      setSaveError((err as Error).message)
      setSaving(false)
    }
  }

  const backTo = isEdit ? `/jobs/${id}` : '/jobs'
  const companyIds = new Set(companies.map((c) => String(c.id)))
  const companyMissing = isEdit && values.companyId && !companyIds.has(values.companyId)

  return (
    <AdminLayout>
      <Link to={backTo} className="back-link">
        <Icon name="arrow-left" size={16} /> {isEdit ? 'Back to job' : 'Back to jobs'}
      </Link>

      <div className="page-head">
        <div>
          <h1>{isEdit ? 'Edit job' : 'Post a job'}</h1>
          <p className="auth-subtitle">{isEdit ? 'Update this job posting.' : 'Create a new job posting.'}</p>
        </div>
      </div>

      {loadState === 'loading' && (
        <div className="panel" aria-busy="true" aria-label="Loading form">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="skeleton skeleton-line" key={i} style={{ height: 40, marginBottom: 16 }} />
          ))}
        </div>
      )}

      {loadState === 'error' && (
        <div className="panel state-panel" role="alert">
          <h2>Couldn't load the form</h2>
          <p className="muted">{loadError}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setLoadState('loading')
              setReloadKey((k) => k + 1)
            }}
          >
            Try again
          </button>
        </div>
      )}

      {loadState === 'ready' && (
        <form className="panel company-form" onSubmit={onSubmit} noValidate>
          <h2 className="form-section-title">Basics</h2>
          <div className="form-grid">
            <TextField
              label="Job title"
              name="title"
              placeholder="e.g. Senior React Developer"
              value={values.title}
              error={errors.title}
              onChange={(e) => update('title', e.target.value)}
            />
            <div className="field">
              <label htmlFor="companyId">Company</label>
              <select
                id="companyId"
                name="companyId"
                className={errors.companyId ? 'invalid' : undefined}
                aria-invalid={!!errors.companyId}
                aria-describedby={errors.companyId ? 'companyId-error' : undefined}
                value={values.companyId}
                onChange={(e) => onCompanyChange(e.target.value)}
              >
                <option value="">Select a company</option>
                {companyMissing && <option value={values.companyId}>{savedCompanyName} (deleted)</option>}
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.companyId && <p className="field-error" id="companyId-error" role="alert">{errors.companyId}</p>}
            </div>
            <SelectField
              label="Job category"
              name="category"
              placeholder="Select a category"
              options={JOB_CATEGORIES}
              value={values.category}
              error={errors.category}
              onChange={(e) => update('category', e.target.value)}
            />
            <TextField
              label="Location"
              name="location"
              placeholder="City, State — or Remote"
              value={values.location}
              error={errors.location}
              onChange={(e) => update('location', e.target.value)}
            />
            <SelectField
              label="Employment type"
              name="employmentType"
              placeholder="Select a type"
              options={EMPLOYMENT_TYPES}
              value={values.employmentType}
              error={errors.employmentType}
              onChange={(e) => update('employmentType', e.target.value)}
            />
            <SelectField
              label="Experience level"
              name="experienceLevel"
              placeholder="Select a level"
              options={EXPERIENCE_LEVELS}
              value={values.experienceLevel}
              error={errors.experienceLevel}
              onChange={(e) => update('experienceLevel', e.target.value)}
            />
          </div>

          <h2 className="form-section-title">Compensation &amp; timeline</h2>
          <div className="form-grid">
            <TextField
              label="Minimum salary (USD / year)"
              name="salaryMin"
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              placeholder="80000"
              value={values.salaryMin}
              error={errors.salaryMin}
              onChange={(e) => update('salaryMin', e.target.value)}
            />
            <TextField
              label="Maximum salary (USD / year)"
              name="salaryMax"
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              placeholder="110000"
              value={values.salaryMax}
              error={errors.salaryMax}
              onChange={(e) => update('salaryMax', e.target.value)}
            />
            <TextField
              label="Application deadline"
              name="deadline"
              type="date"
              min={isEdit ? undefined : todayIso()}
              value={values.deadline}
              error={errors.deadline}
              onChange={(e) => update('deadline', e.target.value)}
            />
            <fieldset className="field status-field">
              <legend>Job status</legend>
              <div className="segmented">
                {(['open', 'closed'] as const).map((s) => (
                  <label key={s} className={values.status === s ? 'selected' : undefined}>
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={values.status === s}
                      onChange={() => {
                        update('status', s)
                        setErrors((e) => ({ ...e, deadline: undefined }))
                      }}
                    />
                    {s === 'open' ? 'Open' : 'Closed'}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <h2 className="form-section-title">Requirements</h2>
          <SkillsInput
            label="Required skills"
            name="skills"
            value={values.skills}
            onChange={(skills) => update('skills', skills)}
            suggestions={SKILL_SUGGESTIONS}
            error={errors.skills}
          />

          {saveError && <div className="alert alert-error" role="alert">{saveError}</div>}

          <div className="form-actions">
            <Link to={backTo} className="btn btn-outline">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Post job'}
            </button>
          </div>
        </form>
      )}
    </AdminLayout>
  )
}
