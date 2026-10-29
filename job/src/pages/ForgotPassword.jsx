import { useState } from 'react'
import { Link } from 'react-router-dom'
import { validateEmail } from '../auth/validation'
import { AuthLayout } from '../components/AuthLayout'
import { TextField } from '../components/FormFields'

// UI only: no email is actually sent.
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState()
  const [sent, setSent] = useState(false)

  const onSubmit = (e) => {
    e.preventDefault()
    const err = validateEmail(email)
    setError(err)
    if (!err) setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent password reset instructions">
        <div className="alert alert-success" role="status">
          If an account exists for <strong>{email}</strong>, you'll receive a reset link shortly.
        </div>
        <button type="button" className="btn btn-outline btn-block" onClick={() => setSent(false)}>
          Use a different email
        </button>
        <p className="auth-switch">
          <Link to="/login">← Back to login</Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email and we'll send you a reset link">
      <form onSubmit={onSubmit} noValidate>
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          error={error}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(undefined)
          }}
        />

        <button type="submit" className="btn btn-primary btn-block">
          Send reset link
        </button>
      </form>
      <p className="auth-switch">
        <Link to="/login">← Back to login</Link>
      </p>
    </AuthLayout>
  )
}
