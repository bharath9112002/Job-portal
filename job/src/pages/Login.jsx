import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ROLES, redirectAfterLogin } from '../auth/roles'
import { DEMO_ACCOUNTS, getRememberedEmail } from '../auth/storage'
import { validateEmail } from '../auth/validation'
import { useAuth } from '../hooks/useAuth'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordField, RoleSelector, TextField } from '../components/FormFields'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState(() => ({ email: getRememberedEmail(), password: '' }))
  const [role, setRole] = useState('admin')
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
    const result = login(form.email, form.password, role, remember)
    if (!result.ok) {
      setFormError(result.error ?? 'Login failed')
      return
    }
    navigate(redirectAfterLogin(role, location.state?.from), { replace: true })
  }

  // Fills the form (and the matching role) with a demo account; the user still clicks "Log in".
  const fillDemo = (demo) => {
    setForm({ email: demo.email, password: demo.password })
    setRole(demo.role)
    setErrors({})
    setFormError('')
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your JobPortal account">
      <form onSubmit={onSubmit} noValidate>
        <RoleSelector
          value={role}
          legend="Log in as"
          onChange={(r) => {
            setRole(r)
            setFormError('')
          }}
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
          Log in as {ROLES[role].label.toLowerCase()}
        </button>
      </form>

      <p className="auth-switch">
        Don't have an account? <Link to="/register">Create one</Link>
      </p>

      <div className="demo-box">
        <p className="demo-title">Demo accounts</p>
        <div className="demo-grid">
          {DEMO_ACCOUNTS.map((demo) => (
            <div className="demo-account" key={demo.id}>
              <strong>{ROLES[demo.role].label}</strong>
              <code>{demo.email}</code>
              <code>{demo.password}</code>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => fillDemo(demo)}>
                Use {ROLES[demo.role].label.toLowerCase()} demo
              </button>
            </div>
          ))}
        </div>
      </div>
    </AuthLayout>
  )
}
