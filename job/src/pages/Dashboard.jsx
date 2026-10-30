import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { STATUSES, isActive } from '../applications/model'
import { fetchCandidates } from '../candidates/api'
import { fetchCompanies } from '../companies/api'
import { fetchJobs } from '../jobs/api'
import { isAcceptingApplications } from '../jobs/types'
import { countAllSavedJobs } from '../saved/storage'
import { QUICK_ACTIONS } from '../data/dashboardData'
import { AdminLayout } from '../components/AdminLayout'
import { BarList, ColumnChart } from '../components/Charts'
import { Icon } from '../components/Icon'
import { useApplications } from '../hooks/useApplications'
import { useAuth } from '../hooks/useAuth'

const ACTION_ROUTES = {
  'post-job': '/jobs/new',
  'add-company': '/companies/new',
  candidates: '/candidates',
  applications: '/applications',
}

const WEEK_MS = 7 * 86_400_000
const fmt = (n) => n.toLocaleString('en-IN')

function timeAgo(iso) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 1440) return `${Math.round(minutes / 60)} hr ago`
  const days = Math.round(minutes / 1440)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

/** Settles to { value } or { error }, so one failing source doesn't blank the dashboard. */
const settle = (promise) => promise.then((value) => ({ value })).catch((err) => ({ error: err.message }))

/** Applications per month for the last `count` months, from their applied dates. */
function applicationsByMonth(applications, count = 6) {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    return {
      label: d.toLocaleDateString('en-IN', { month: 'short' }),
      value: applications.filter((a) => {
        const at = new Date(a.appliedAt)
        return `${at.getFullYear()}-${at.getMonth()}` === key
      }).length,
    }
  })
}

/** Newest events across applications, jobs and candidate profiles. */
function recentActivity(applications, jobs, candidates, limit = 8) {
  const events = []
  for (const a of applications) {
    a.history.forEach((h, i) => {
      const base = { at: h.at, link: `/applications/${a.id}`, key: `app-${a.id}-${i}` }
      if (i === 0) {
        events.push({ ...base, icon: 'file', text: `${a.candidateName} applied`, detail: `${a.jobTitle} · ${a.companyName}` })
      } else if (h.status === 'withdrawn') {
        events.push({ ...base, icon: 'x', text: `${a.candidateName} withdrew an application`, detail: a.jobTitle })
      } else {
        events.push({
          ...base,
          icon: h.status === 'hired' ? 'check' : h.status === 'interview' ? 'calendar' : 'bolt',
          text: `${a.candidateName} moved to ${STATUSES[h.status]?.label ?? h.status}`,
          detail: a.jobTitle,
        })
      }
    })
  }
  for (const j of jobs) {
    events.push({ at: j.postedAt, icon: 'briefcase', text: 'New job posted', detail: `${j.title} · ${j.companyName}`, link: `/jobs/${j.id}`, key: `job-${j.id}` })
  }
  for (const c of candidates) {
    events.push({ at: c.createdAt, icon: 'users', text: 'New candidate profile', detail: c.fullName, link: `/candidates/${c.id}`, key: `cand-${c.id}` })
  }
  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit)
}

export default function Dashboard() {
  const { user } = useAuth()
  const { applications, loadState: appsState } = useApplications()
  const [sources, setSources] = useState(null)
  const [weekAgo] = useState(() => new Date(Date.now() - WEEK_MS).toISOString())
  const [today] = useState(() =>
    new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  )

  // Load fresh every time the dashboard opens, so new jobs, profiles and companies show up.
  useEffect(() => {
    let cancelled = false
    Promise.all([settle(fetchCompanies()), settle(fetchJobs()), settle(fetchCandidates())]).then(
      ([companies, jobs, candidates]) => !cancelled && setSources({ companies, jobs, candidates }),
    )
    return () => {
      cancelled = true
    }
  }, [])

  const jobs = sources?.jobs.value ?? []
  const candidates = sources?.candidates.value ?? []
  const appsReady = appsState === 'ready'
  const savedTotal = countAllSavedJobs()
  const newThisWeek = (items, field) => items.filter((x) => x[field] > weekAgo).length

  const stats = [
    { id: 'companies', label: 'Total Companies', icon: 'building', source: sources?.companies, value: sources?.companies.value?.length },
    {
      id: 'jobs',
      label: 'Total Jobs',
      icon: 'briefcase',
      source: sources?.jobs,
      value: jobs.length,
      note: `${newThisWeek(jobs, 'postedAt')} posted this week`,
    },
    {
      id: 'active',
      label: 'Active Job Postings',
      icon: 'bolt',
      source: sources?.jobs,
      value: jobs.filter(isAcceptingApplications).length,
      note: `${jobs.filter((j) => j.status === 'closed').length} closed`,
    },
    {
      id: 'candidates',
      label: 'Total Candidates',
      icon: 'users',
      source: sources?.candidates,
      value: candidates.length,
      note: `${newThisWeek(candidates, 'createdAt')} new this week`,
    },
    {
      id: 'applications',
      label: 'Total Applications',
      icon: 'file',
      source: appsState === 'loading' ? undefined : { error: appsState === 'error' ? 'Unavailable' : undefined },
      value: applications.length,
      note: `${newThisWeek(applications, 'appliedAt')} new this week`,
    },
    { id: 'saved', label: 'Saved Jobs', icon: 'bookmark', source: {}, value: savedTotal, note: 'across all users' },
  ]

  const monthly = applicationsByMonth(applications)
  const pipeline = Object.entries(STATUSES).map(([key, s]) => ({
    label: s.label,
    value: applications.filter((a) => a.status === key).length,
  }))
  const hired = applications.filter((a) => a.status === 'hired').length
  const decided = applications.filter((a) => !isActive(a.status) && a.status !== 'withdrawn').length

  const categoryCounts = new Map()
  for (const j of jobs.filter(isAcceptingApplications)) categoryCounts.set(j.category, (categoryCounts.get(j.category) ?? 0) + 1)
  const byCategory = [...categoryCounts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)

  const activity = sources && appsReady ? recentActivity(applications, jobs, candidates) : null

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="auth-subtitle">
            Welcome back, {user?.name.split(' ')[0]}. Here's what's happening on the portal.
          </p>
        </div>
        <span className="page-date">
          <Icon name="calendar" size={16} />
          {today}
        </span>
      </div>

      {/* Headline numbers */}
      <section className="stats-grid" aria-label="Key metrics">
        {stats.map((s) => (
          <article className="stat-card" key={s.id}>
            <div className="stat-top">
              <span className="stat-label">{s.label}</span>
              <span className="stat-icon">
                <Icon name={s.icon} />
              </span>
            </div>
            {!s.source ? (
              <div className="skeleton skeleton-line" style={{ width: '45%', height: 30 }} aria-label="Loading" />
            ) : s.source.error ? (
              <>
                <span className="stat-value muted-value">—</span>
                <span className="stat-note error-note">Couldn’t load</span>
              </>
            ) : (
              <>
                <span className="stat-value">{fmt(s.value)}</span>
                {s.note && <span className="stat-note">{s.note}</span>}
              </>
            )}
          </article>
        ))}
      </section>

      {/* Quick actions */}
      <section className="section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          {QUICK_ACTIONS.map((a) => (
            <Link to={ACTION_ROUTES[a.id]} className="action-card" key={a.id}>
              <span className="action-icon">
                <Icon name={a.icon} />
              </span>
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
                <p className="muted">Last 6 months, by date applied</p>
              </div>
              <div className="panel-figure">
                <strong>{appsReady ? fmt(monthly.reduce((sum, d) => sum + d.value, 0)) : '–'}</strong>
                <span>total</span>
              </div>
            </div>
            {appsReady ? (
              <ColumnChart title="Applications per month" data={monthly} unit="applications" />
            ) : (
              <div className="skeleton skeleton-line" style={{ height: 220 }} />
            )}
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Hiring pipeline</h3>
                <p className="muted">Applications by status</p>
              </div>
              <div className="panel-figure">
                <strong>{decided ? `${Math.round((hired / decided) * 100)}%` : '—'}</strong>
                <span>hire rate</span>
              </div>
            </div>
            {appsReady ? (
              <BarList title="Applications by status" data={pipeline} unit="applications" />
            ) : (
              <div className="skeleton skeleton-line" style={{ height: 180 }} />
            )}
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Active jobs by category</h3>
                <p className="muted">Postings accepting applications</p>
              </div>
            </div>
            {!sources ? (
              <div className="skeleton skeleton-line" style={{ height: 180 }} />
            ) : byCategory.length ? (
              <BarList title="Active jobs by category" data={byCategory} unit="jobs" />
            ) : (
              <p className="muted">No active jobs.</p>
            )}
          </div>
        </div>
      </section>

      {/* Recent activities */}
      <section className="section">
        <div className="panel">
          <div className="panel-head">
            <h3>Recent Activities</h3>
            <Link to="/applications" className="btn btn-outline btn-sm">All applications</Link>
          </div>
          {!activity ? (
            <div className="skeleton skeleton-line" style={{ height: 200 }} />
          ) : activity.length === 0 ? (
            <p className="muted">Nothing has happened yet.</p>
          ) : (
            <ul className="activity-list">
              {activity.map((a) => (
                <li key={a.key}>
                  <span className="activity-icon">
                    <Icon name={a.icon} size={18} />
                  </span>
                  <div className="activity-body">
                    <Link to={a.link} className="activity-text">{a.text}</Link>
                    <span className="activity-detail">{a.detail}</span>
                  </div>
                  <time className="activity-time" dateTime={a.at}>{timeAgo(a.at)}</time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </AdminLayout>
  )
}
