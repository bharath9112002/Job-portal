import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createCompany, fetchCompany, logoUrl, updateCompany, websiteFor } from '../../companies/api'
import { INDUSTRIES } from '../../companies/types'
import { validateEmail } from '../../auth/validation'
import { AdminLayout } from '../../components/AdminLayout'
import { SelectField, TextAreaField, TextField } from '../../components/FormFields'
import { Icon } from '../../components/Icon'

const EMPTY = {
  name: '',
  industry: '',
  location: '',
  email: '',
  employees: '',
  description: '',
}

function validate(v) {
  const employees = Number(v.employees)
  return {
    name: !v.name.trim()
      ? 'Company name is required'
      : v.name.trim().length < 2
        ? 'Name must be at least 2 characters'
        : undefined,
    industry: v.industry ? undefined : 'Select an industry',
    location: !v.location.trim()
      ? 'Location is required'
      : !v.location.includes(',')
        ? 'Use the format "City, State"'
        : undefined,
    email: validateEmail(v.email),
    employees: !v.employees
      ? 'Number of employees is required'
      : !Number.isInteger(employees) || employees < 1
        ? 'Enter a whole number of 1 or more'
        : employees > 10_000_000
          ? 'That seems too large'
          : undefined,
    description: !v.description.trim()
      ? 'Description is required'
      : v.description.trim().length < 20
        ? 'Write at least 20 characters'
        : undefined,
  }
}

export default function CompanyForm() {
  const { id } = useParams()
  const isEdit = id !== undefined
  const navigate = useNavigate()

  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [loadState, setLoadState] = useState(isEdit ? 'loading' : 'ready')
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    fetchCompany(Number(id))
      .then((c) => {
        if (cancelled) return
        setValues({
          name: c.name,
          industry: c.industry,
          location: c.location,
          email: c.email,
          employees: String(c.employees),
          description: c.description,
        })
        setLoadState('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err.message)
        setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  const update = (field, value) => {
    setValues((v) => ({ ...v, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
    setSaveError('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.values(found).some(Boolean)) {
      document.querySelector('[aria-invalid="true"]')?.focus()
      return
    }

    // Logo and website aren't editable: both are generated from the company name.
    const name = values.name.trim()
    const data = {
      name,
      industry: values.industry,
      location: values.location.trim(),
      website: websiteFor(name),
      email: values.email.trim().toLowerCase(),
      employees: Number(values.employees),
      description: values.description.trim(),
      logo: logoUrl(name, isEdit ? Number(id) : name.length),
    }

    setSaving(true)
    setSaveError('')
    try {
      const saved = isEdit ? await updateCompany(Number(id), data) : await createCompany(data)
      navigate(`/companies/${saved.id}`, {
        replace: true,
        state: { flash: isEdit ? 'Company updated.' : 'Company added.' },
      })
    } catch (err) {
      setSaveError(err.message)
      setSaving(false)
    }
  }

  const backTo = isEdit ? `/companies/${id}` : '/companies'

  return (
    <AdminLayout>
      <Link to={backTo} className="back-link">
        <Icon name="arrow-left" size={16} /> {isEdit ? 'Back to company' : 'Back to companies'}
      </Link>

      <div className="page-head">
        <div>
          <h1>{isEdit ? 'Edit company' : 'Add company'}</h1>
          <p className="auth-subtitle">
            {isEdit ? 'Update the company profile.' : 'Register a new employer on the portal.'}
          </p>
        </div>
      </div>

      {loadState === 'loading' && (
        <div className="panel" aria-busy="true" aria-label="Loading company">
          {Array.from({ length: 5 }, (_, i) => (
            <div className="skeleton skeleton-line" key={i} style={{ height: 40, marginBottom: 16 }} />
          ))}
        </div>
      )}

      {loadState === 'error' && (
        <div className="panel state-panel" role="alert">
          <h2>Couldn't load this company</h2>
          <p className="muted">{loadError}</p>
          <Link to="/companies" className="btn btn-primary">
            Back to companies
          </Link>
        </div>
      )}

      {loadState === 'ready' && (
        <form className="panel company-form" onSubmit={onSubmit} noValidate>
          <div className="form-grid">
            <TextField
              label="Company name"
              name="name"
              placeholder="Acme Corporation"
              value={values.name}
              error={errors.name}
              onChange={(e) => update('name', e.target.value)}
            />

            <SelectField
              label="Industry"
              name="industry"
              placeholder="Select an industry"
              options={
                INDUSTRIES.includes(values.industry) || !values.industry ? INDUSTRIES : [values.industry, ...INDUSTRIES]
              }
              value={values.industry}
              error={errors.industry}
              onChange={(e) => update('industry', e.target.value)}
            />

            <TextField
              label="Location"
              name="location"
              placeholder="City, State"
              value={values.location}
              error={errors.location}
              onChange={(e) => update('location', e.target.value)}
            />

            <TextField
              label="Number of employees"
              name="employees"
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="250"
              value={values.employees}
              error={errors.employees}
              onChange={(e) => update('employees', e.target.value)}
            />

            <TextField
              label="Contact email"
              name="email"
              type="email"
              placeholder="hr@example.com"
              value={values.email}
              error={errors.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>

          <TextAreaField
            label="Company description"
            name="description"
            rows={5}
            placeholder="What does the company do, and what is it like to work there?"
            hint={`${values.description.trim().length} characters (minimum 20)`}
            value={values.description}
            error={errors.description}
            onChange={(e) => update('description', e.target.value)}
          />

          {saveError && (
            <div className="alert alert-error" role="alert">
              {saveError}
            </div>
          )}

          <div className="form-actions">
            <Link to={backTo} className="btn btn-outline">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add company'}
            </button>
          </div>
        </form>
      )}
    </AdminLayout>
  )
}
