import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { AdminLayout } from '../components/AdminLayout'
import { BarList, ColumnChart } from '../components/Charts'
import { Icon } from '../components/Icon'
import {
  APPLICATION_PIPELINE,
  APPLICATIONS_BY_MONTH,
  JOBS_BY_CATEGORY,
  QUICK_ACTIONS,
  RECENT_ACTIVITIES,
  STATS,
} from '../data/dashboardData'

const ACTION_ROUTES: Record<string, string> = {
  'post-job': '/jobs/new',
  'add-company': '/companies/new',
  candidates: '/candidates',
  applications: '/applications',
}

function timeAgo(minutes: number) {
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 1440) return `${Math.round(minutes / 60)} hr ago`
  const days = Math.round(minutes / 1440)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export default function Dashboard() {
  const { user } = useAuth()
  const [today] = useState(() =>
    new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  )

  const yearTotal = APPLICATIONS_BY_MONTH.reduce((sum, d) => sum + d.value, 0)
  const hired = APPLICATION_PIPELINE.at(-1)!.value
  const applied = APPLICATION_PIPELINE[0].value

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="auth-subtitle">Welcome back, {user?.name.split(' ')[0]}. Here's what's happening on the portal.</p>
        </div>
        <span className="page-date">
          <Icon name="calendar" size={16} />
          {today}
        </span>
      </div>

      {/* Headline numbers */}
      <section className="stats-grid" aria-label="Key metrics">
        {STATS.map((s) => (
          <article className="stat-card" key={s.id}>
            <div className="stat-top">
              <span className="stat-label">{s.label}</span>
              <span className="stat-icon"><Icon name={s.icon} /></span>
            </div>
            <span className="stat-value">{s.value.toLocaleString('en-IN')}</span>
            <span className={s.change >= 0 ? 'stat-change up' : 'stat-change down'}>
              {s.change >= 0 ? '▲' : '▼'} {Math.abs(s.change)}%
              <span className="stat-change-note"> vs last month</span>
            </span>
          </article>
        ))}
      </section>

      {/* Quick actions */}
      <section className="section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          {QUICK_ACTIONS.map((a) => (
            <Link to={ACTION_ROUTES[a.id]} className="action-card" key={a.id}>
              <span className="action-icon"><Icon name={a.icon} /></span>
              <span>
                <span className="action-title">{a.title}</span>
                <span className="action-desc">{a.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Dashboard statistics */}
      <section className="section">
        <h2 className="section-title">Dashboard Statistics</h2>
        <div className="charts-grid">
          <div className="panel panel-wide">
            <div className="panel-head">
              <div>
                <h3>Applications per month</h3>
                <p className="muted">Last 12 months</p>
              </div>
              <div className="panel-figure">
                <strong>{yearTotal.toLocaleString('en-IN')}</strong>
                <span>total</span>
              </div>
            </div>
            <ColumnChart title="Applications per month" data={APPLICATIONS_BY_MONTH} unit="applications" />
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Hiring pipeline</h3>
                <p className="muted">Applications by stage</p>
              </div>
              <div className="panel-figure">
                <strong>{((hired / applied) * 100).toFixed(1)}%</strong>
                <span>hire rate</span>
              </div>
            </div>
            <BarList title="Applications by stage" data={APPLICATION_PIPELINE} unit="applications" />
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Active jobs by category</h3>
                <p className="muted">Open postings right now</p>
              </div>
            </div>
            <BarList title="Active jobs by category" data={JOBS_BY_CATEGORY} unit="jobs" />
          </div>
        </div>
      </section>

      {/* Recent activities */}
      <section className="section">
        <div className="panel">
          <div className="panel-head">
            <h3>Recent Activities</h3>
          </div>
          <ul className="activity-list">
            {RECENT_ACTIVITIES.map((a) => (
              <li key={a.id}>
                <span className="activity-icon"><Icon name={a.icon} size={18} /></span>
                <div className="activity-body">
                  <span className="activity-text">{a.text}</span>
                  <span className="activity-detail">{a.detail}</span>
                </div>
                <time className="activity-time">{timeAgo(a.minutesAgo)}</time>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </AdminLayout>
  )
}
