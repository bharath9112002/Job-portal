import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ROLES } from '../auth/roles'
import { useApplications } from '../hooks/useApplications'
import { useAuth } from '../hooks/useAuth'
import { Icon } from './Icon'

// Each role gets its own menu. `end` makes a link active only on its exact path.
const NAV_BY_ROLE = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: 'grid' },
    { to: '/companies', label: 'Companies', icon: 'building' },
    { to: '/jobs', label: 'Jobs', icon: 'briefcase' },
    { to: '/search', label: 'Job Search', icon: 'search' },
    { to: '/saved', label: 'Saved Jobs', icon: 'bookmark' },
    { to: '/candidates', label: 'Candidates', icon: 'users' },
    { to: '/applications', label: 'Applications', icon: 'file', badge: 'newApplications' },
    { to: '/reports', label: 'Reports', icon: 'chart' },
  ],
  candidate: [
    { to: '/candidate', label: 'Home', icon: 'grid', end: true },
    { to: '/candidate/jobs', label: 'Find Jobs', icon: 'search' },
    { to: '/candidate/saved', label: 'Saved Jobs', icon: 'bookmark' },
    { to: '/candidate/applications', label: 'My Applications', icon: 'file' },
    { to: '/candidate/profile', label: 'My Profile', icon: 'users' },
  ],
}

export function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const role = user?.role ?? 'admin'
  const nav = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.admin
  const { applications } = useApplications()
  // Applications nobody has reviewed yet — shown as a count next to "Applications" for admins.
  const badges = { newApplications: applications.filter((a) => a.status === 'applied').length }

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={menuOpen ? 'admin-shell menu-open' : 'admin-shell'}>
      <aside className="sidebar" aria-label="Main navigation">
        <div className="brand-logo sidebar-brand">
          JobPortal
          <span className="portal-tag">{role === 'candidate' ? 'Careers' : 'Admin'}</span>
        </div>
        <nav>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name={item.icon} />
              {item.label}
              {item.badge && badges[item.badge] > 0 && (
                <span className="nav-badge" aria-label={`${badges[item.badge]} new`}>
                  {badges[item.badge]}
                </span>
              )}
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
            <span className={`role-pill ${role}`}>{ROLES[role]?.label}</span>
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
