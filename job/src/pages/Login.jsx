import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { DEMO_ACCOUNTS, getRememberedEmail } from '../auth/storage'
import { useAuth } from '../hooks/useAuth'
import { validateEmail } from '../auth/validation'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordField, TextField } from '../components/FormFields'

const DEMO = DEMO_ACCOUNTS[0]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from ?? '/dashboard'

  const [form, setForm] = useState(() => ({ email: getRememberedEmail(), password: '' }))
  const [remember, setRemember] = useState(() => !!getRememberedEmail())
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')

  const validate = (values) => ({
    email: validateEmail(values.email),
    password: values.password ? undefined : 'Password is required',
  })

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
    setFormError('')
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.values(found).some(Boolean)) return
    const result = login(form.email, form.password, remember)
    if (!result.ok) {
      setFormError(result.error ?? 'Login failed')
      return
    }
    navigate(from, { replace: true })
  }

  // Fills the form with the demo credentials; the user still clicks "Log in".
  const fillDemo = () => {
    setForm({ email: DEMO.email, password: DEMO.password })
    setErrors({})
    setFormError('')
  }

  return (
    <AuthLayout title="Admin login" subtitle="Log in to continue to the admin panel">
      <form onSubmit={onSubmit} noValidate>
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
          autoComplete="current-password"
          placeholder="Enter your password"
          value={form.password}
          error={errors.password}
          onChange={(e) => update('password', e.target.value)}
        />

        <div className="form-row">
          <label className="checkbox">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember me
          </label>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        {formError && (
          <div className="alert alert-error" role="alert">
            {formError}
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block">
          Log in
        </button>
      </form>

      <p className="auth-switch">
        Don't have an account? <Link to="/register">Create one</Link>
      </p>

      <div className="demo-box">
        <p className="demo-title">Demo admin account</p>
        <p className="demo-creds">
          Email <code>{DEMO.email}</code> · Password <code>{DEMO.password}</code>
        </p>
        <button type="button" className="btn btn-outline btn-block" onClick={fillDemo}>
          Use demo credentials
        </button>
      </div>
    </AuthLayout>
  )
}
