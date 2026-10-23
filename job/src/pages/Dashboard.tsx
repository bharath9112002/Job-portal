import { useNavigate } from 'react-router-dom'
import { getUsers } from '../auth/storage'
import { useAuth } from '../auth/useAuth'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const admins = getUsers()

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand-logo">JobPortal</div>
        <div className="topbar-right">
          <span className="role-badge">Admin</span>
          <span className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
          <button type="button" className="btn btn-outline" onClick={onLogout}>Log out</button>
        </div>
      </header>

      <main className="dashboard-main">
        <h1>Admin Dashboard</h1>
        <p className="auth-subtitle">Welcome back, {user.name.split(' ')[0]}. Here's an overview of the portal.</p>

        <div className="cards">
          {[
            ['Admin accounts', String(admins.length)],
            ['Job postings', '0'],
            ['Applications', '0'],
          ].map(([label, value]) => (
            <div className="stat-card" key={label}>
              <span className="stat-value">{value}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>

        <section className="profile-card">
          <h2>Account details</h2>
          <p className="muted">Stored in your browser's local storage.</p>
          <dl>
            <dt>Name</dt><dd>{user.name}</dd>
            <dt>Email</dt><dd>{user.email}</dd>
            <dt>Role</dt><dd>Admin</dd>
            <dt>Member since</dt><dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
            <dt>Logged in at</dt><dd>{new Date(user.loggedInAt).toLocaleString()}</dd>
          </dl>
        </section>
      </main>
    </div>
  )
}
