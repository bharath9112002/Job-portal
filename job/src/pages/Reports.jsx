import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCandidates } from '../candidates/api'
import { fetchCompanies } from '../companies/api'
import { fetchJobs } from '../jobs/api'
import { isAcceptingApplications } from '../jobs/types'
import {
  APPLICATIONS_BY_STATUS,
  JOBS_BY_CATEGORY,
  JOBS_BY_TYPE,
  monthlyApplications,
} from '../data/reportsData'
import { AdminLayout } from '../components/AdminLayout'
import { BarList, ColumnChart } from '../components/Charts'
import { Icon } from '../components/Icon'
import { useApplications } from '../hooks/useApplications'

const fmt = (n) => n.toLocaleString('en-IN')
const TOP_JOBS = 5

/** Settles to { value } or { error } so one failing source doesn't blank the whole report. */
const settle = (promise) => promise.then((value) => ({ value })).catch((err) => ({ error: err.message }))

function SampleBadge() {
  return <span className="data-badge sample" title="Dummy data for demonstration">Sample data</span>
}
function LiveBadge() {
  return <span className="data-badge live" title="Calculated from the portal's current data">Live</span>
}

export default function Reports() {
  const { applications, loadState: appsState } = useApplications()
  const [sources, setSources] = useState(null)
  const [monthly] = useState(() => monthlyApplications())
  const [showTable, setShowTable] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([settle(fetchJobs()), settle(fetchCompanies()), settle(fetchCandidates())]).then(
      ([jobs, companies, candidates]) => !cancelled && setSources({ jobs, companies, candidates }),
    )
    return () => {
      cancelled = true
    }
  }, [])

  const jobs = sources?.jobs.value ?? []
  const jobsById = new Map(jobs.map((j) => [j.id, j]))
  const activeJobs = jobs.filter(isAcceptingApplications).length

  const tiles = [
    { label: 'Total Job Postings', icon: 'briefcase', source: sources?.jobs, value: sources?.jobs.value?.length },
    {
      label: 'Active Jobs',
      icon: 'bolt',
      source: sources?.jobs,
      value: sources?.jobs.value ? activeJobs : undefined,
      note: sources?.jobs.value ? `of ${fmt(jobs.length)} postings accepting applications` : '',
    },
    { label: 'Total Companies', icon: 'building', source: sources?.companies, value: sources?.companies.value?.length },
    {
      label: 'Total Candidates',
      icon: 'users',
      source: sources?.candidates,
      value: sources?.candidates.value?.length,
    },
    {
      label: 'Total Applications',
      icon: 'file',
      source: appsState === 'loading' ? undefined : { error: appsState === 'error' ? 'Unavailable' : undefined },
      value: appsState === 'ready' ? applications.length : undefined,
      note:
        appsState === 'ready'
          ? `${applications.filter((a) => !['hired', 'rejected', 'withdrawn'].includes(a.status)).length} in progress`
          : '',
    },
  ]

  // Most applied jobs: count applications per job (withdrawn ones don't count).
  const perJob = new Map()
  for (const a of applications) {
    if (a.status === 'withdrawn') continue
    const entry = perJob.get(a.jobId) ?? { jobId: a.jobId, title: a.jobTitle, company: a.companyName, count: 0, latest: '' }
    entry.count += 1
    if (a.appliedAt > entry.latest) entry.latest = a.appliedAt
    perJob.set(a.jobId, entry)
  }
  const topJobs = [...perJob.values()]
    .sort((a, b) => b.count - a.count || b.latest.localeCompare(a.latest))
    .slice(0, TOP_JOBS)
  const topMax = Math.max(1, ...topJobs.map((j) => j.count))

  // Monthly summary figures.
  const total12 = monthly.reduce((s, m) => s + m.value, 0)
  const peak = monthly.reduce((best, m) => (m.value > best.value ? m : best), monthly[0])
  const [prev, current] = monthly.slice(-2)
  const change = ((current.value - prev.value) / prev.value) * 100

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <h1>Reports</h1>
          <p className="auth-subtitle">Portal-wide numbers and hiring trends.</p>
        </div>
        <button type="button" className="btn btn-outline btn-icon no-print" onClick={() => window.print()}>
          <Icon name="file" size={18} />
          Print report
        </button>
      </div>

      {/* ---------- Totals (live) ---------- */}
      <section className="section" aria-labelledby="totals-title">
        <div className="report-section-head">
          <h2 className="section-title" id="totals-title">Overview</h2>
          <LiveBadge />
        </div>
        <div className="report-tiles">
          {tiles.map((t) => (
            <article className="stat-card" key={t.label}>
              <div className="stat-top">
                <span className="stat-label">{t.label}</span>
                <span className="stat-icon"><Icon name={t.icon} /></span>
              </div>
              {!t.source ? (
                <div className="skeleton skeleton-line" style={{ width: '50%', height: 30 }} aria-label="Loading" />
              ) : t.source.error ? (
                <>
                  <span className="stat-value muted-value">—</span>
                  <span className="stat-note error-note">Couldn’t load: {t.source.error}</span>
                </>
              ) : (
                <>
                  <span className="stat-value">{fmt(t.value)}</span>
                  {t.note && <span className="stat-note">{t.note}</span>}
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Most applied jobs (live) ---------- */}
      <section className="section">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Most applied jobs</h3>
              <p className="muted">Applications received per job, excluding withdrawn</p>
            </div>
            <LiveBadge />
          </div>
          {appsState === 'loading' ? (
            <div className="skeleton skeleton-line" style={{ height: 120 }} />
          ) : topJobs.length === 0 ? (
            <p className="muted">No applications yet.</p>
          ) : (
            <ol className="top-jobs">
              {topJobs.map((j, i) => {
                // Only label closed/deleted once the job list has actually loaded.
                const jobsLoaded = !!sources?.jobs.value
                const job = jobsById.get(j.jobId)
                return (
                  <li key={j.jobId}>
                    <span className="top-rank" aria-hidden="true">{i + 1}</span>
                    <div className="top-body">
                      <div className="top-line">
                        <span>
                          <Link to={`/applications?job=${j.jobId}`} className="top-title">{j.title}</Link>
                          <span className="muted top-company">
                            {j.company}
                            {jobsLoaded && (job ? (isAcceptingApplications(job) ? '' : ' · closed') : ' · deleted')}
                          </span>
                        </span>
                        <span className="top-count">
                          {j.count} <span className="muted">{j.count === 1 ? 'application' : 'applications'}</span>
                        </span>
                      </div>
                      <div className="bar-track" aria-hidden="true">
                        <div className="bar-fill" style={{ width: `${(j.count / topMax) * 100}%` }} />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </section>

      {/* ---------- Monthly statistics (sample) ---------- */}
      <section className="section">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Monthly application statistics</h3>
              <p className="muted">
                Applications received, {monthly[0].fullLabel} – {current.fullLabel}
              </p>
            </div>
            <div className="panel-head-actions">
              <SampleBadge />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                aria-pressed={showTable}
                onClick={() => setShowTable((s) => !s)}
              >
                {showTable ? 'Show chart' : 'Show table'}
              </button>
            </div>
          </div>

          <dl className="month-stats">
            <div><dt>Total (12 months)</dt><dd>{fmt(total12)}</dd></div>
            <div><dt>Monthly average</dt><dd>{fmt(Math.round(total12 / monthly.length))}</dd></div>
            <div><dt>Peak month</dt><dd>{peak.fullLabel} · {fmt(peak.value)}</dd></div>
            <div>
              <dt>This month vs last</dt>
              <dd className={change >= 0 ? 'trend up' : 'trend down'}>
                {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
              </dd>
            </div>
          </dl>

          {showTable ? (
            <table className="report-table">
              <caption className="sr-only">Applications per month</caption>
              <thead>
                <tr><th scope="col">Month</th><th scope="col">Applications</th><th scope="col">Change</th></tr>
              </thead>
              <tbody>
                {monthly.map((m, i) => {
                  const diff = i ? ((m.value - monthly[i - 1].value) / monthly[i - 1].value) * 100 : null
                  return (
                    <tr key={m.fullLabel}>
                      <td>{m.fullLabel}</td>
                      <td>{fmt(m.value)}</td>
                      <td className={diff === null ? 'muted' : diff >= 0 ? 'trend up' : 'trend down'}>
                        {diff === null ? '—' : `${diff >= 0 ? '+' : '−'}${Math.abs(diff).toFixed(1)}%`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <ColumnChart title="Applications per month" data={monthly} unit="applications" />
          )}
        </div>
      </section>

      {/* ---------- Other charts (sample) ---------- */}
      <section className="section">
        <div className="report-section-head">
          <h2 className="section-title">Charts</h2>
          <SampleBadge />
        </div>
        <div className="charts-grid charts-grid-3">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Applications by status</h3>
                <p className="muted">Where applications are in the pipeline</p>
              </div>
            </div>
            <BarList title="Applications by status" data={APPLICATIONS_BY_STATUS} unit="applications" />
          </div>
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Jobs by category</h3>
                <p className="muted">Postings in each category</p>
              </div>
            </div>
            <BarList title="Jobs by category" data={JOBS_BY_CATEGORY} unit="jobs" />
          </div>
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Jobs by employment type</h3>
                <p className="muted">Postings by type</p>
              </div>
            </div>
            <BarList title="Jobs by employment type" data={JOBS_BY_TYPE} unit="jobs" />
          </div>
        </div>
      </section>
    </AdminLayout>
  )
}
