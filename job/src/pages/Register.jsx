import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { homeFor } from '../auth/roles'
import { useAuth } from '../hooks/useAuth'
import { passwordStrength, validateEmail, validateName, validatePassword } from '../auth/validation'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordField, RoleSelector, TextField } from '../components/FormFields'

const STRENGTH_LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [role, setRole] = useState('candidate')
  const [terms, setTerms] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')

  const strength = passwordStrength(form.password)

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
    setFormError('')
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const found = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirmPassword: !form.confirmPassword
        ? 'Please confirm your password'
        : form.confirmPassword !== form.password
          ? 'Passwords do not match'
          : undefined,
      terms: terms ? undefined : 'You must accept the terms to continue',
    }
    setErrors(found)
    if (Object.values(found).some(Boolean)) return

    const result = register({ name: form.name, email: form.email, password: form.password, role })
    if (!result.ok) {
      setFormError(result.error ?? 'Registration failed')
      return
    }
    navigate(homeFor(role), { replace: true })
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join as a candidate or an admin">
      <form onSubmit={onSubmit} noValidate>
        <RoleSelector value={role} onChange={setRole} />
        <TextField
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Jane Doe"
          value={form.name}
          error={errors.name}
          onChange={(e) => update('name', e.target.value)}
        />

        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          error={errors.email}
          onChange={(e) => update('email', e.target.value)}
        />

        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password}
          error={errors.password}
          onChange={(e) => update('password', e.target.value)}
        />

        {form.password && (
          <div className="strength" data-score={strength}>
            <div className="strength-bar">
              <span style={{ width: `${(strength / 4) * 100}%` }} />
            </div>
            <span className="strength-label">{STRENGTH_LABELS[strength]}</span>
          </div>
        )}
        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          error={errors.confirmPassword}
          onChange={(e) => update('confirmPassword', e.target.value)}
        />

        <div className="field">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => {
                setTerms(e.target.checked)
                setErrors((er) => ({ ...er, terms: undefined }))
              }}
            />
            I agree to the Terms of Service and Privacy Policy
          </label>
          {errors.terms && (
            <p className="field-error" role="alert">
              {errors.terms}
            </p>
          )}
        </div>

        {formError && (
          <div className="alert alert-error" role="alert">
            {formError}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block">
          Create account
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  )
}
