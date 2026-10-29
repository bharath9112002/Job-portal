import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Icon } from './Icon'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
  { to: '/companies', label: 'Companies', icon: 'building' },
  { to: '/jobs', label: 'Jobs', icon: 'briefcase' },
  { to: '/search', label: 'Job Search', icon: 'search' },
  { to: '/candidates', label: 'Candidates', icon: 'users' },
  { to: '/applications', label: 'Applications', icon: 'file' },
]

export function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={menuOpen ? 'admin-shell menu-open' : 'admin-shell'}>
      <aside className="sidebar" aria-label="Main navigation">
        <div className="brand-logo sidebar-brand">JobPortal</div>
        <nav>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="nav-link nav-logout" onClick={onLogout}>
          <Icon name="logout" />
          Log out
        </button>
      </aside>
      <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />

      <div className="admin-main">
        <header className="topbar">
          <button
            type="button"
            className="menu-toggle"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <Icon name="menu" />
          </button>
          <div className="topbar-right">
            <div className="topbar-user">
              <span className="topbar-name">{user?.name}</span>
              <span className="topbar-email">{user?.email}</span>
            </div>
            <span className="avatar" aria-hidden="true">
              {user?.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>
        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  )
}
