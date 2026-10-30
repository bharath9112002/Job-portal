import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchJobs } from '../../jobs/api'
import { formatDate, formatSalary, isAcceptingApplications, postedAgo } from '../../jobs/types'
import { AdminLayout } from '../../components/AdminLayout'
import { Icon } from '../../components/Icon'
import { useSavedJobs } from '../../hooks/useSavedJobs'

export default function SavedJobs() {
  const { saved, remove, toggle, storageError } = useSavedJobs()
  const [jobs, setJobs] = useState(null)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [lastRemoved, setLastRemoved] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchJobs()
      .then((list) => !cancelled && setJobs(list))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const byId = new Map((jobs ?? []).map((j) => [j.id, j]))
  const entries = saved.map((s) => ({ ...s, job: byId.get(s.jobId) }))

  const onRemove = (entry) => {
    remove(entry.jobId)
    setLastRemoved(entry)
  }

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <h1>Saved Jobs</h1>
          <p className="auth-subtitle">Jobs you bookmarked from Job Search.</p>
        </div>
        <Link to="/search" className="btn btn-outline btn-icon">
          <Icon name="search" size={18} />
          Browse jobs
        </Link>
      </div>

      {storageError && (
        <div className="alert alert-error" role="alert">
          Your browser blocked saving, so changes here will be lost when you leave the page.
        </div>
      )}

      {lastRemoved && (
        <div className="alert alert-success alert-dismissible" role="status">
          <span>
            Removed “{lastRemoved.job?.title ?? 'job'}” from saved jobs.{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                toggle(lastRemoved.jobId)
                setLastRemoved(null)
              }}
            >
              Undo
            </button>
          </span>
          <button type="button" aria-label="Dismiss" onClick={() => setLastRemoved(null)}>
            <Icon name="x" size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="panel state-panel" role="alert">
          <h2>Couldn't load your saved jobs</h2>
          <p className="muted">{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setError('')
              setReloadKey((k) => k + 1)
            }}
          >
            Try again
          </button>
        </div>
      )}

      {!error && !jobs && (
        <div className="result-list" aria-busy="true" aria-label="Loading saved jobs">
          {Array.from({ length: Math.min(3, Math.max(1, saved.length)) }, (_, i) => (
            <div className="result-card" key={i}>
              <div className="skeleton skeleton-line" style={{ width: '45%', height: 18 }} />
              <div className="skeleton skeleton-line" style={{ width: '30%' }} />
            </div>
          ))}
        </div>
      )}

      {jobs && (
        <>
          <p className="result-count">
            {entries.length === 0 ? '' : `${entries.length} saved ${entries.length === 1 ? 'job' : 'jobs'}`}
          </p>

          {entries.length === 0 ? (
            <div className="panel state-panel">
              <Icon name="bookmark" size={32} />
              <h2>No saved jobs yet</h2>
              <p className="muted">Use the bookmark button on any job in Job Search to save it here.</p>
              <Link to="/search" className="btn btn-primary">Go to Job Search</Link>
            </div>
          ) : (
            <div className="result-list">
              {entries.map((entry) =>
                entry.job ? (
                  <article className="result-card" key={entry.jobId}>
                    <div className="result-top">
                      <div>
                        <h2 className="result-title">
                          <Link to={`/search/${entry.jobId}`}>{entry.job.title}</Link>
                        </h2>
                        <p className="result-company">{entry.job.companyName}</p>
                      </div>
                      <span className="result-salary">
                        {formatSalary(entry.job.salaryMin, entry.job.salaryMax)}<small> / yr</small>
                      </span>
                    </div>
                    <ul className="job-facts">
                      <li><Icon name="pin" size={15} />{entry.job.location}</li>
                      <li><Icon name="briefcase" size={15} />{entry.job.employmentType}</li>
                      <li>
                        <Icon name="calendar" size={15} />
                        {isAcceptingApplications(entry.job) ? `Apply by ${formatDate(entry.job.deadline)}` : (
                          <span className="job-deadline expired">No longer accepting applications</span>
                        )}
                      </li>
                    </ul>
                    <div className="result-foot">
                      <span className="muted">Saved {postedAgo(entry.savedAt).toLowerCase()}</span>
                      <span className="saved-actions">
                        <button type="button" className="btn btn-outline btn-sm btn-danger-outline" onClick={() => onRemove(entry)}>
                          <Icon name="trash" size={15} /> Remove
                        </button>
                        <Link to={`/search/${entry.jobId}`} className="btn btn-primary btn-sm">
                          {isAcceptingApplications(entry.job) ? 'View & apply' : 'View'}
                        </Link>
                      </span>
                    </div>
                  </article>
                ) : (
                  <article className="result-card unavailable" key={entry.jobId}>
                    <div className="result-top">
                      <div>
                        <h2 className="result-title">Job no longer available</h2>
                        <p className="result-company">This posting was deleted.</p>
                      </div>
                    </div>
                    <div className="result-foot">
                      <span className="muted">Saved {postedAgo(entry.savedAt).toLowerCase()}</span>
                      <button type="button" className="btn btn-outline btn-sm btn-danger-outline" onClick={() => onRemove(entry)}>
                        <Icon name="trash" size={15} /> Remove
                      </button>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  )
}
