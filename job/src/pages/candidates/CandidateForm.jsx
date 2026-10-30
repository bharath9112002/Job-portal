import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createCandidate, fetchCandidate, fetchCandidateByEmail, updateCandidate } from '../../candidates/api'
import { DEGREE_SUGGESTIONS, currentMonth, emptyEducation, emptyExperience } from '../../candidates/model'
import { validateCandidate } from '../../candidates/validation'
import { SKILL_SUGGESTIONS } from '../../jobs/types'
import { AdminLayout } from '../../components/AdminLayout'
import { TextAreaField, TextField } from '../../components/FormFields'
import { Icon } from '../../components/Icon'
import { PhotoUpload } from '../../components/PhotoUpload'
import { ResumeUpload } from '../../components/ResumeUpload'
import { SkillsInput } from '../../components/SkillsInput'
import { useAuth } from '../../hooks/useAuth'

const emptyProfile = () => ({
  fullName: '',
  email: '',
  mobile: '',
  address: { line: '', city: '', state: '', postalCode: '' },
  skills: [],
  experience: [],
  education: [emptyEducation()],
  resume: null,
  photo: '',
})

const toFormValues = (c) => ({
  fullName: c.fullName,
  email: c.email,
  mobile: c.mobile,
  address: { ...c.address },
  skills: [...c.skills],
  experience: c.experience.map((e) => ({ ...e })),
  education: c.education.map((e) => ({ ...e })),
  resume: c.resume,
  photo: c.photo,
})

/**
 * Create/edit a candidate profile. Admins edit any profile (/candidates/:id/edit).
 * With `self`, a logged-in candidate creates or edits their own profile, whose email is locked to their account.
 */
export default function CandidateForm({ self = false }) {
  const params = useParams()
  const { user } = useAuth()
  // In self mode the profile id is only known once we've looked up the candidate's own profile.
  const [selfId, setSelfId] = useState(undefined)
  const id = self ? selfId : params.id
  const isEdit = id !== undefined
  const navigate = useNavigate()

  const [values, setValues] = useState(emptyProfile)
  const [errors, setErrors] = useState({})
  const [loadState, setLoadState] = useState(self || isEdit ? 'loading' : 'ready')
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Self mode: find the candidate's own profile; if there isn't one yet, start a new one from their account.
  useEffect(() => {
    if (!self) return
    let cancelled = false
    fetchCandidateByEmail(user.email)
      .then((c) => {
        if (cancelled) return
        if (c) {
          setSelfId(String(c.id))
          setValues(toFormValues(c))
        } else {
          setValues((v) => ({ ...v, fullName: user.name, email: user.email }))
        }
        setLoadState('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err)
        setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [self, user.email, user.name])

  useEffect(() => {
    if (self || !isEdit) return
    let cancelled = false
    fetchCandidate(Number(id))
      .then((c) => {
        if (cancelled) return
        setValues(toFormValues(c))
        setLoadState('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err)
        setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [id, isEdit, self])

  const clearError = (...keys) => {
    if (keys.some((k) => errors[k])) {
      setErrors((e) => {
        const next = { ...e }
        keys.forEach((k) => delete next[k])
        return next
      })
    }
    setSaveError('')
  }

  const setField = (field, value) => {
    setValues((v) => ({ ...v, [field]: value }))
    clearError(field)
  }

  const setAddress = (field, value) => {
    setValues((v) => ({ ...v, address: { ...v.address, [field]: value } }))
    clearError(`address.${field}`)
  }

  const updateRow = (list, index, patch) => {
    setValues((v) => ({ ...v, [list]: v[list].map((row, i) => (i === index ? { ...row, ...patch } : row)) }))
    clearError(...Object.keys(patch).map((f) => `${list}.${index}.${f}`))
  }

  const addRow = (list) => {
    setValues((v) => ({ ...v, [list]: [...v[list], list === 'experience' ? emptyExperience() : emptyEducation()] }))
    clearError(list)
  }

  // Removing a row shifts the rows after it, so their error keys would no longer line up — drop them.
  const removeRow = (list, index) => {
    setValues((v) => ({ ...v, [list]: v[list].filter((_, i) => i !== index) }))
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith(`${list}.`))))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const found = validateCandidate(values)
    setErrors(found)
    if (Object.keys(found).length) {
      // Let the error messages render, then move focus to the first invalid field.
      setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 0)
      return
    }

    const data = {
      fullName: values.fullName.trim(),
      email: values.email.trim().toLowerCase(),
      mobile: values.mobile.trim(),
      address: {
        line: values.address.line.trim(),
        city: values.address.city.trim(),
        state: values.address.state.trim(),
        postalCode: values.address.postalCode.trim(),
      },
      skills: values.skills,
      experience: values.experience.map((x) => ({
        ...x,
        title: x.title.trim(),
        company: x.company.trim(),
        endDate: x.current ? '' : x.endDate,
        description: x.description.trim(),
      })),
      education: values.education.map((x) => ({
        ...x,
        degree: x.degree.trim(),
        fieldOfStudy: x.fieldOfStudy.trim(),
        institution: x.institution.trim(),
        grade: x.grade.trim(),
      })),
      resume: values.resume,
      photo: values.photo,
    }

    setSaving(true)
    setSaveError('')
    try {
      const saved = isEdit ? await updateCandidate(Number(id), data) : await createCandidate(data)
      navigate(self ? '/candidate/profile' : `/candidates/${saved.id}`, {
        replace: true,
        state: { flash: isEdit ? 'Profile updated.' : 'Profile created.' },
      })
    } catch (err) {
      if (err.field) {
        setErrors((er) => ({ ...er, [err.field]: err.message }))
        document.getElementById(err.field)?.focus()
      } else {
        setSaveError(err.message)
      }
      setSaving(false)
    }
  }

  const backTo = self ? (isEdit ? '/candidate/profile' : '/candidate') : isEdit ? `/candidates/${id}` : '/candidates'
  const thisMonth = currentMonth()
  const errorCount = Object.keys(errors).length

  return (
    <AdminLayout>
      <Link to={backTo} className="back-link">
        <Icon name="arrow-left" size={16} />{' '}
        {isEdit ? 'Back to profile' : self ? 'Back to home' : 'Back to candidates'}
      </Link>

      <div className="page-head">
        <div>
          <h1>{self ? (isEdit ? 'Edit my profile' : 'Create your profile') : isEdit ? 'Edit profile' : 'Create candidate profile'}</h1>
          <p className="auth-subtitle">
            {self
              ? 'Employers see this when you apply. Fields marked * are required.'
              : isEdit
                ? 'Update this candidate’s details.'
                : 'Fields marked * are required.'}
          </p>
        </div>
      </div>

      {loadState === 'loading' && (
        <div className="panel" aria-busy="true" aria-label="Loading profile">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="skeleton skeleton-line" key={i} style={{ height: 40, marginBottom: 16 }} />
          ))}
        </div>
      )}

      {loadState === 'error' && (
        <div className="panel state-panel" role="alert">
          <h2>{loadError?.status === 404 ? 'Candidate not found' : "Couldn't load this profile"}</h2>
          <p className="muted">{loadError?.message}</p>
          <Link to={self ? '/candidate' : '/candidates'} className="btn btn-primary">
            {self ? 'Back to home' : 'Back to candidates'}
          </Link>
        </div>
      )}

      {loadState === 'ready' && (
        <form className="profile-form" onSubmit={onSubmit} noValidate>
          {errorCount > 0 && (
            <div className="alert alert-error" role="alert">
              Please fix {errorCount === 1 ? 'the highlighted field' : `the ${errorCount} highlighted fields`} below.
            </div>
          )}

          {/* ---------- Personal details ---------- */}
          <section className="panel form-panel">
            <h2 className="form-section-title">Personal details</h2>
            <PhotoUpload value={values.photo} name={values.fullName} onChange={(photo) => setField('photo', photo)} />
            <div className="form-grid">
              <TextField
                label="Full name *"
                name="fullName"
                autoComplete="name"
                placeholder="e.g. Priya Sharma"
                value={values.fullName}
                error={errors.fullName}
                onChange={(e) => setField('fullName', e.target.value)}
              />
              <TextField
                label="Email *"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={values.email}
                error={errors.email}
                readOnly={self}
                title={self ? 'Linked to your account — it can’t be changed here' : undefined}
                onChange={(e) => setField('email', e.target.value)}
              />
              <TextField
                label="Mobile number *"
                name="mobile"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                value={values.mobile}
                error={errors.mobile}
                onChange={(e) => setField('mobile', e.target.value)}
              />
            </div>
          </section>

          {/* ---------- Address ---------- */}
          <section className="panel form-panel">
            <h2 className="form-section-title">Address</h2>
            <TextField
              label="Street address *"
              name="address.line"
              autoComplete="street-address"
              placeholder="House no., street, area"
              value={values.address.line}
              error={errors['address.line']}
              onChange={(e) => setAddress('line', e.target.value)}
            />
            <div className="form-grid form-grid-3">
              <TextField
                label="City *"
                name="address.city"
                autoComplete="address-level2"
                value={values.address.city}
                error={errors['address.city']}
                onChange={(e) => setAddress('city', e.target.value)}
              />
              <TextField
                label="State *"
                name="address.state"
                autoComplete="address-level1"
                value={values.address.state}
                error={errors['address.state']}
                onChange={(e) => setAddress('state', e.target.value)}
              />
              <TextField
                label="Postal code *"
                name="address.postalCode"
                autoComplete="postal-code"
                value={values.address.postalCode}
                error={errors['address.postalCode']}
                onChange={(e) => setAddress('postalCode', e.target.value)}
              />
            </div>
          </section>

          {/* ---------- Skills ---------- */}
          <section className="panel form-panel">
            <h2 className="form-section-title">Skills</h2>
            <SkillsInput
              label="Skills *"
              name="skills"
              value={values.skills}
              onChange={(skills) => setField('skills', skills)}
              suggestions={SKILL_SUGGESTIONS}
              error={errors.skills}
              max={20}
            />
          </section>

          {/* ---------- Experience ---------- */}
          <section className="panel form-panel">
            <div className="form-section-head">
              <h2 className="form-section-title">Experience</h2>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => addRow('experience')}>
                <Icon name="plus" size={16} /> Add experience
              </button>
            </div>
            {values.experience.length === 0 && (
              <p className="muted empty-rows">No work experience added — fine for freshers.</p>
            )}
            {values.experience.map((x, i) => {
              const k = (f) => `experience.${i}.${f}`
              return (
                <fieldset className="row-card" key={x.id}>
                  <legend className="row-legend">
                    Experience {i + 1}
                  </legend>
                  <button
                    type="button"
                    className="row-remove"
                    aria-label={`Remove experience ${i + 1}`}
                    onClick={() => removeRow('experience', i)}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                  <div className="form-grid">
                    <TextField
                      label="Job title *"
                      name={k('title')}
                      value={x.title}
                      error={errors[k('title')]}
                      onChange={(e) => updateRow('experience', i, { title: e.target.value })}
                    />
                    <TextField
                      label="Company *"
                      name={k('company')}
                      value={x.company}
                      error={errors[k('company')]}
                      onChange={(e) => updateRow('experience', i, { company: e.target.value })}
                    />
                    <TextField
                      label="Start date *"
                      name={k('startDate')}
                      type="month"
                      max={thisMonth}
                      value={x.startDate}
                      error={errors[k('startDate')]}
                      onChange={(e) => updateRow('experience', i, { startDate: e.target.value })}
                    />
                    <TextField
                      label={x.current ? 'End date' : 'End date *'}
                      name={k('endDate')}
                      type="month"
                      max={thisMonth}
                      disabled={x.current}
                      value={x.current ? '' : x.endDate}
                      error={errors[k('endDate')]}
                      onChange={(e) => updateRow('experience', i, { endDate: e.target.value })}
                    />
                  </div>
                  <label className="checkbox current-check">
                    <input
                      type="checkbox"
                      checked={x.current}
                      onChange={(e) => updateRow('experience', i, { current: e.target.checked, endDate: '' })}
                    />
                    I currently work here
                  </label>
                  <TextAreaField
                    label="Description"
                    name={k('description')}
                    rows={3}
                    placeholder="Key responsibilities and achievements (optional)"
                    hint={`${x.description.length}/500`}
                    value={x.description}
                    error={errors[k('description')]}
                    onChange={(e) => updateRow('experience', i, { description: e.target.value })}
                  />
                </fieldset>
              )
            })}
          </section>

          {/* ---------- Education ---------- */}
          <section className="panel form-panel">
            <div className="form-section-head">
              <h2 className="form-section-title">Education</h2>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => addRow('education')}>
                <Icon name="plus" size={16} /> Add education
              </button>
            </div>
            {errors.education && <p className="field-error" role="alert">{errors.education}</p>}
            <datalist id="degree-suggestions">
              {DEGREE_SUGGESTIONS.map((d) => <option key={d} value={d} />)}
            </datalist>
            {values.education.map((x, i) => {
              const k = (f) => `education.${i}.${f}`
              return (
                <fieldset className="row-card" key={x.id}>
                  <legend className="row-legend">Education {i + 1}</legend>
                  <button
                    type="button"
                    className="row-remove"
                    aria-label={`Remove education ${i + 1}`}
                    onClick={() => removeRow('education', i)}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                  <div className="form-grid">
                    <TextField
                      label="Degree *"
                      name={k('degree')}
                      list="degree-suggestions"
                      placeholder="e.g. B.Tech"
                      value={x.degree}
                      error={errors[k('degree')]}
                      onChange={(e) => updateRow('education', i, { degree: e.target.value })}
                    />
                    <TextField
                      label="Field of study"
                      name={k('fieldOfStudy')}
                      placeholder="e.g. Computer Science"
                      value={x.fieldOfStudy}
                      onChange={(e) => updateRow('education', i, { fieldOfStudy: e.target.value })}
                    />
                    <TextField
                      label="Institution *"
                      name={k('institution')}
                      placeholder="College or university"
                      value={x.institution}
                      error={errors[k('institution')]}
                      onChange={(e) => updateRow('education', i, { institution: e.target.value })}
                    />
                    <TextField
                      label="Grade"
                      name={k('grade')}
                      placeholder="e.g. 8.5 CGPA or 82%"
                      value={x.grade}
                      onChange={(e) => updateRow('education', i, { grade: e.target.value })}
                    />
                    <TextField
                      label="Start year *"
                      name={k('startYear')}
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="2018"
                      value={x.startYear}
                      error={errors[k('startYear')]}
                      onChange={(e) => updateRow('education', i, { startYear: e.target.value.replace(/\D/g, '') })}
                    />
                    <TextField
                      label="End year (or expected) *"
                      name={k('endYear')}
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="2022"
                      value={x.endYear}
                      error={errors[k('endYear')]}
                      onChange={(e) => updateRow('education', i, { endYear: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                </fieldset>
              )
            })}
          </section>

          {/* ---------- Resume ---------- */}
          <section className="panel form-panel">
            <h2 className="form-section-title">Resume</h2>
            <ResumeUpload value={values.resume} onChange={(resume) => setField('resume', resume)} />
          </section>

          {saveError && <div className="alert alert-error" role="alert">{saveError}</div>}

          <div className="form-actions sticky-actions">
            <Link to={backTo} className="btn btn-outline">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create profile'}
            </button>
          </div>
        </form>
      )}
    </AdminLayout>
  )
}
