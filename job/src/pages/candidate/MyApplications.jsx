import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { isActive } from '../../applications/model'
import { formatDate } from '../../jobs/types'
import { AdminLayout } from '../../components/AdminLayout'
import { AppStatusBadge } from '../../components/AppStatusBadge'
import { Icon } from '../../components/Icon'
import { useApplications } from '../../hooks/useApplications'
import { useListParams } from '../../hooks/useListParams'
import { useMyProfile } from '../../hooks/useMyProfile'

const TABS = [
  ['', 'All', () => true],
  ['active', 'In progress', (a) => isActive(a.status)],
  ['closed', 'Closed', (a) => !isActive(a.status)],
]

/** The logged-in candidate's own applications. */
export default function MyApplications() {
  const me = useMyProfile()
  const { applications, loadState, error, reload } = useApplications()
  const { get, setParam, query, search, setSearch, clearAll } = useListParams()
  const tab = TABS.some(([key]) => key === get('view')) ? get('view') : ''

  const mine = useMemo(
    () =>
      me.profile
        ? applications
            .filter((a) => a.candidateId === me.profile.id)
            .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
        : [],
    [applications, me.profile],
  )
  const q = query.trim().toLowerCase()
  const searched = mine.filter((a) => !q || [a.jobTitle, a.companyName].some((v) => v.toLowerCase().includes(q)))
  const visible = searched.filter(TABS.find(([key]) => key === tab)[2])

  const loading = loadState === 'loading' || me.loadState === 'loading'

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <h1>My Applications</h1>
          <p className="auth-subtitle">Track every job you’ve applied for.</p>
        </div>
        <Link to="/candidate/jobs" className="btn btn-primary btn-icon">
          <Icon name="search" size={18} /> Find jobs
        </Link>
      </div>

      <div className="status-tabs" role="tablist" aria-label="Filter applications">
        {TABS.map(([key, label, test]) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'status-tab active' : 'status-tab'}
            onClick={() => setParam('view', key)}
          >
            {label} <span className="tab-count">{loading ? '–' : searched.filter(test).length}</span>
          </button>
        ))}
      </div>

      <div className="toolbar toolbar-single">
        <label className="search-box">
          <Icon name="search" size={18} />
          <input
            type="search"
            placeholder="Search by job title or company"
            aria-label="Search my applications"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {loading && (
        <div className="result-list" aria-busy="true" aria-label="Loading applications" style={{ marginTop: 16 }}>
          {Array.from({ length: 3 }, (_, i) => (
            <div className="result-card" key={i}>
              <div className="skeleton skeleton-line" style={{ width: '40%', height: 18 }} />
              <div className="skeleton skeleton-line" style={{ width: '25%' }} />
            </div>
          ))}
        </div>
      )}

      {(loadState === 'error' || me.loadState === 'error') && (
        <div className="panel state-panel" role="alert">
          <h2>Couldn't load your applications</h2>
          <p className="muted">{error || me.error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              reload()
              me.reload()
            }}
          >
            Try again
          </button>
        </div>
      )}

      {!loading && loadState === 'ready' && me.loadState === 'ready' && (
        <>
          <p className="result-count">
            {visible.length === 0 ? '' : `${visible.length} ${visible.length === 1 ? 'application' : 'applications'}`}
          </p>
          {!me.profile ? (
            <div className="panel state-panel">
              <h2>Create your profile first</h2>
              <p className="muted">You need a profile to apply for jobs.</p>
              <Link to="/candidate/profile/edit" className="btn btn-primary">Create profile</Link>
            </div>
          ) : visible.length === 0 ? (
            <div className="panel state-panel">
              <h2>{mine.length ? 'No matching applications' : 'No applications yet'}</h2>
              <p className="muted">
                {mine.length ? 'Try a different search or tab.' : 'Find a job you like and apply in a couple of clicks.'}
              </p>
              {mine.length ? (
                <button type="button" className="btn btn-outline" onClick={clearAll}>Clear filters</button>
              ) : (
                <Link to="/candidate/jobs" className="btn btn-primary">Find jobs</Link>
              )}
            </div>
          ) : (
            <div className="result-list">
              {visible.map((a) => (
                <article className="result-card" key={a.id}>
                  <div className="result-top">
                    <div>
                      <h2 className="result-title">
                        <Link to={`/candidate/applications/${a.id}`}>{a.jobTitle}</Link>
                      </h2>
                      <p className="result-company">{a.companyName}</p>
                    </div>
                    <AppStatusBadge status={a.status} />
                  </div>
                  <div className="result-foot">
                    <span className="muted">
                      Applied {formatDate(a.appliedAt)}
                      {a.updatedAt !== a.appliedAt && ` · updated ${formatDate(a.updatedAt)}`}
                    </span>
                    <Link to={`/candidate/applications/${a.id}`} className="btn btn-outline btn-sm">View</Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  )
}
