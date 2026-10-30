import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { STATUSES, isActive } from '../../applications/model'
import { formatDate } from '../../jobs/types'
import { AdminLayout } from '../../components/AdminLayout'
import { AppStatusBadge } from '../../components/AppStatusBadge'
import { Avatar } from '../../components/Avatar'
import { FlashMessage } from '../../components/FlashMessage'
import { Icon } from '../../components/Icon'
import { Pagination } from '../../components/Pagination'
import { useApplications } from '../../hooks/useApplications'
import { useFlash } from '../../hooks/useFlash'
import { useListParams } from '../../hooks/useListParams'

const PAGE_SIZE = 10

const TABS = [
  ['', 'All', () => true],
  ['active', 'In progress', (a) => isActive(a.status)],
  ['hired', 'Hired', (a) => a.status === 'hired'],
  ['rejected', 'Rejected', (a) => a.status === 'rejected'],
  ['withdrawn', 'Withdrawn', (a) => a.status === 'withdrawn'],
]

const SORTS = {
  applied: { label: 'Newest applications', compare: (a, b) => b.appliedAt.localeCompare(a.appliedAt) },
  updated: { label: 'Recently updated', compare: (a, b) => b.updatedAt.localeCompare(a.updatedAt) },
  candidate: { label: 'Candidate A → Z', compare: (a, b) => a.candidateName.localeCompare(b.candidateName) },
}

export default function ApplicationList() {
  const location = useLocation()
  const { applications, loadState, error, reload } = useApplications()
  const { get, setParam, query, search, setSearch, requestedPage, changePage, clearAll } = useListParams()
  const [flash, setFlash] = useFlash()

  const tab = TABS.some(([key]) => key === get('view')) ? get('view') : ''
  const status = STATUSES[get('status')] ? get('status') : ''
  const jobFilter = Number(get('job')) || 0
  const sort = SORTS[get('sort')] ? get('sort') : 'applied'

  // Everything except the tab, so tab counts reflect the search and other filters.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return applications.filter(
      (a) =>
        (!jobFilter || a.jobId === jobFilter) &&
        (!status || a.status === status) &&
        (!q ||
          [a.candidateName, a.candidateEmail, a.jobTitle, a.companyName].some((v) => v.toLowerCase().includes(q))),
    )
  }, [applications, query, status, jobFilter])

  const tabTest = TABS.find(([key]) => key === tab)[2]
  const visible = filtered.filter(tabTest).sort(SORTS[sort].compare)
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const page = Math.min(requestedPage, totalPages)
  const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const jobTitle = jobFilter ? applications.find((a) => a.jobId === jobFilter)?.jobTitle : ''
  const hasFilters = !!(query || status || jobFilter || tab)

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <h1>Applications</h1>
          <p className="auth-subtitle">Track every application and move candidates through the hiring pipeline.</p>
        </div>
        <Link to="/search" className="btn btn-primary btn-icon">
          <Icon name="search" size={18} />
          Find jobs to apply
        </Link>
      </div>

      <FlashMessage message={flash} onDismiss={() => setFlash('')} />

      <div className="status-tabs" role="tablist" aria-label="Filter by stage">
        {TABS.map(([key, label, test]) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'status-tab active' : 'status-tab'}
            onClick={() => setParam('view', key)}
          >
            {label} <span className="tab-count">{loadState === 'ready' ? filtered.filter(test).length : '–'}</span>
          </button>
        ))}
      </div>

      <div className="toolbar toolbar-apps">
        <label className="search-box">
          <Icon name="search" size={18} />
          <input
            type="search"
            placeholder="Search candidate, email, job title or company"
            aria-label="Search applications"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select aria-label="Filter by status" value={status} onChange={(e) => setParam('status', e.target.value)}>
          <option value="">Any status</option>
          {Object.entries(STATUSES).map(([key, s]) => (
            <option key={key} value={key}>{s.label}</option>
          ))}
        </select>
        <select
          aria-label="Sort applications"
          value={sort}
          onChange={(e) => setParam('sort', e.target.value === 'applied' ? '' : e.target.value)}
        >
          {Object.entries(SORTS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
        </select>
      </div>

      {jobFilter > 0 && (
        <div className="active-chips">
          <button type="button" className="filter-chip" onClick={() => setParam('job', '')} aria-label="Remove job filter">
            Job: {jobTitle || `#${jobFilter}`} <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {loadState === 'loading' && (
        <div className="app-table" aria-busy="true" aria-label="Loading applications">
          {Array.from({ length: 5 }, (_, i) => (
            <div className="app-row" key={i}>
              <div className="skeleton skeleton-line" style={{ width: '70%' }} />
              <div className="skeleton skeleton-line" style={{ width: '60%' }} />
              <div className="skeleton skeleton-line" style={{ width: '50%' }} />
            </div>
          ))}
        </div>
      )}

      {loadState === 'error' && (
        <div className="panel state-panel" role="alert">
          <h2>Couldn't load applications</h2>
          <p className="muted">{error}</p>
          <button type="button" className="btn btn-primary" onClick={reload}>Try again</button>
        </div>
      )}

      {loadState === 'ready' && (
        <>
          <p className="result-count">
            {visible.length === 0
              ? 'No applications found'
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, visible.length)} of ${visible.length} ${visible.length === 1 ? 'application' : 'applications'}`}
          </p>

          {visible.length === 0 ? (
            <div className="panel state-panel">
              <h2>{hasFilters ? 'No matching applications' : 'No applications yet'}</h2>
              <p className="muted">
                {hasFilters ? 'Try a different search or filter.' : 'Apply for a job from Job Search to get started.'}
              </p>
              {hasFilters ? (
                <button type="button" className="btn btn-outline" onClick={clearAll}>Clear filters</button>
              ) : (
                <Link to="/search" className="btn btn-primary">Go to Job Search</Link>
              )}
            </div>
          ) : (
            <div className="app-table" role="table" aria-label="Applications">
              <div className="app-row app-head" role="row">
                <span role="columnheader">Candidate</span>
                <span role="columnheader">Job</span>
                <span role="columnheader">Applied</span>
                <span role="columnheader">Status</span>
                <span role="columnheader"><span className="sr-only">Actions</span></span>
              </div>
              {pageItems.map((a) => (
                <div className="app-row" role="row" key={a.id}>
                  <span role="cell" className="app-candidate">
                    <Avatar src="" name={a.candidateName} size={36} />
                    <span>
                      <Link to={`/candidates/${a.candidateId}`} className="app-name">{a.candidateName}</Link>
                      <span className="muted">{a.candidateEmail}</span>
                    </span>
                  </span>
                  <span role="cell" className="app-job">
                    <span className="app-job-title">{a.jobTitle}</span>
                    <span className="muted">{a.companyName}</span>
                  </span>
                  <span role="cell" className="app-date">
                    <span className="mobile-label">Applied </span>
                    {formatDate(a.appliedAt)}
                  </span>
                  <span role="cell"><AppStatusBadge status={a.status} /></span>
                  <span role="cell" className="app-action">
                    <Link
                      to={`/applications/${a.id}`}
                      state={{ from: location.search }}
                      className="btn btn-outline btn-sm"
                    >
                      View
                    </Link>
                  </span>
                </div>
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={changePage} />
        </>
      )}
    </AdminLayout>
  )
}
