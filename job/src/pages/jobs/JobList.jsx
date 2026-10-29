import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteJob, fetchJobs } from '../../jobs/api'
import { EMPLOYMENT_TYPES, JOB_CATEGORIES, formatDate, formatSalary, isPastDeadline } from '../../jobs/types'
import { AdminLayout } from '../../components/AdminLayout'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { FlashMessage } from '../../components/FlashMessage'
import { Icon } from '../../components/Icon'
import { Pagination } from '../../components/Pagination'
import { useFlash } from '../../hooks/useFlash'
import { useListParams } from '../../hooks/useListParams'

const PAGE_SIZE = 8

const SORTS = {
  newest: { label: 'Newest first', compare: (a, b) => b.postedAt.localeCompare(a.postedAt) },
  deadline: { label: 'Deadline: soonest', compare: (a, b) => a.deadline.localeCompare(b.deadline) },
  salary: { label: 'Salary: highest', compare: (a, b) => b.salaryMax - a.salaryMax },
  title: { label: 'Title: A → Z', compare: (a, b) => a.title.localeCompare(b.title) },
}

export default function JobList() {
  const { get, setParam, query, search, setSearch, requestedPage, changePage, clearAll } = useListParams()
  const status = get('status')
  const category = get('category')
  const type = get('type')
  const sort = SORTS[get('sort')] ? get('sort') : 'newest'

  const [jobs, setJobs] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [flash, setFlash] = useFlash()
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchJobs()
      .then((data) => {
        if (cancelled) return
        setJobs(data)
        setLoadState('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  // Everything except the status filter, so the tab counts reflect the other filters.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return jobs.filter(
      (j) =>
        (!category || j.category === category) &&
        (!type || j.employmentType === type) &&
        (!q ||
          j.title.toLowerCase().includes(q) ||
          j.companyName.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          j.skills.some((s) => s.toLowerCase().includes(q))),
    )
  }, [jobs, query, category, type])

  const counts = {
    all: filtered.length,
    open: filtered.filter((j) => j.status === 'open').length,
    closed: filtered.filter((j) => j.status === 'closed').length,
  }

  const visible = useMemo(
    () => filtered.filter((j) => !status || j.status === status).sort(SORTS[sort].compare),
    [filtered, status, sort],
  )

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const page = Math.min(requestedPage, totalPages)
  const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = !!(query || category || type || status)

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteJob(toDelete.id)
      setJobs((list) => list.filter((j) => j.id !== toDelete.id))
      setFlash(`"${toDelete.title}" was deleted.`)
      setToDelete(null)
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <h1>Jobs</h1>
          <p className="auth-subtitle">Create and manage job postings.</p>
        </div>
        <Link to="/jobs/new" className="btn btn-primary btn-icon">
          <Icon name="plus" size={18} />
          Post a job
        </Link>
      </div>

      <FlashMessage message={flash} onDismiss={() => setFlash('')} />

      <div className="status-tabs" role="tablist" aria-label="Filter by status">
        {[
          ['', 'All', counts.all],
          ['open', 'Open', counts.open],
          ['closed', 'Closed', counts.closed],
        ].map(([value, label, n]) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={status === value}
            className={status === value ? 'status-tab active' : 'status-tab'}
            onClick={() => setParam('status', value)}
          >
            {label} <span className="tab-count">{loadState === 'ready' ? n : '–'}</span>
          </button>
        ))}
      </div>

      <div className="toolbar toolbar-jobs">
        <label className="search-box">
          <Icon name="search" size={18} />
          <input
            type="search"
            placeholder="Search title, company, location or skill"
            aria-label="Search jobs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select aria-label="Filter by category" value={category} onChange={(e) => setParam('category', e.target.value)}>
          <option value="">All categories</option>
          {JOB_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select aria-label="Filter by employment type" value={type} onChange={(e) => setParam('type', e.target.value)}>
          <option value="">All types</option>
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort jobs"
          value={sort}
          onChange={(e) => setParam('sort', e.target.value === 'newest' ? '' : e.target.value)}
        >
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {loadState === 'loading' && (
        <div className="job-list" aria-busy="true" aria-label="Loading jobs">
          {Array.from({ length: 4 }, (_, i) => (
            <div className="job-card" key={i}>
              <div className="skeleton skeleton-line" style={{ width: '40%', height: 18 }} />
              <div className="skeleton skeleton-line" style={{ width: '25%' }} />
              <div className="skeleton skeleton-line" style={{ width: '60%' }} />
            </div>
          ))}
        </div>
      )}

      {loadState === 'error' && (
        <div className="panel state-panel" role="alert">
          <h2>Couldn't load jobs</h2>
          <p className="muted">{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setLoadState('loading')
              setReloadKey((k) => k + 1)
            }}
          >
            Try again
          </button>
        </div>
      )}

      {loadState === 'ready' && (
        <>
          <p className="result-count">
            {visible.length === 0
              ? 'No jobs found'
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, visible.length)} of ${visible.length} ${visible.length === 1 ? 'job' : 'jobs'}`}
          </p>

          {visible.length === 0 ? (
            <div className="panel state-panel">
              <h2>No matching jobs</h2>
              <p className="muted">
                {hasFilters ? 'Try different filters or search terms.' : 'Post your first job to get started.'}
              </p>
              {hasFilters ? (
                <button type="button" className="btn btn-outline" onClick={clearAll}>
                  Clear filters
                </button>
              ) : (
                <Link to="/jobs/new" className="btn btn-primary">
                  Post a job
                </Link>
              )}
            </div>
          ) : (
            <div className="job-list">
              {pageItems.map((j) => {
                const expired = j.status === 'open' && isPastDeadline(j.deadline)
                return (
                  <article className="job-card" key={j.id}>
                    <div className="job-card-main">
                      <div className="job-card-top">
                        <Link to={`/jobs/${j.id}`} className="job-title">
                          {j.title}
                        </Link>
                        <span className={`status-badge ${j.status}`}>
                          <Icon name={j.status === 'open' ? 'check' : 'x'} size={12} />
                          {j.status === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      <Link to={`/companies/${j.companyId}`} className="job-company">
                        {j.companyName}
                      </Link>
                      <ul className="job-facts">
                        <li>
                          <Icon name="briefcase" size={15} />
                          {j.employmentType}
                        </li>
                        <li>
                          <Icon name="users" size={15} />
                          {j.experienceLevel}
                        </li>
                        <li>
                          <Icon name="pin" size={15} />
                          {j.location}
                        </li>
                        <li className="job-salary">{formatSalary(j.salaryMin, j.salaryMax)} / yr</li>
                      </ul>
                      <div className="job-skills">
                        {j.skills.slice(0, 4).map((s) => (
                          <span className="skill-tag static" key={s}>
                            {s}
                          </span>
                        ))}
                        {j.skills.length > 4 && <span className="more-skills">+{j.skills.length - 4} more</span>}
                      </div>
                    </div>
                    <div className="job-card-side">
                      <span className={expired ? 'job-deadline expired' : 'job-deadline'}>
                        <Icon name="calendar" size={15} />
                        {expired ? 'Deadline passed · ' : 'Apply by '}
                        {formatDate(j.deadline)}
                      </span>
                      <span className="chip">{j.category}</span>
                      <div className="card-actions job-actions">
                        <Link to={`/jobs/${j.id}`} className="btn btn-outline btn-sm">
                          <Icon name="eye" size={16} /> View
                        </Link>
                        <Link to={`/jobs/${j.id}/edit`} className="btn btn-outline btn-sm">
                          <Icon name="edit" size={16} /> Edit
                        </Link>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm btn-danger-outline"
                          onClick={() => {
                            setDeleteError('')
                            setToDelete(j)
                          }}
                        >
                          <Icon name="trash" size={16} /> Delete
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={changePage} />
        </>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete job posting?"
        message={`"${toDelete?.title}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </AdminLayout>
  )
}
