import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCandidates } from '../../candidates/api'
import { formatDuration, latestRole, totalExperienceMonths } from '../../candidates/model'
import { AdminLayout } from '../../components/AdminLayout'
import { Avatar } from '../../components/Avatar'
import { Icon } from '../../components/Icon'
import { Pagination } from '../../components/Pagination'
import { useListParams } from '../../hooks/useListParams'

const PAGE_SIZE = 9

export default function CandidateList() {
  const { query, search, setSearch, requestedPage, changePage, clearAll } = useListParams()

  const [candidates, setCandidates] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchCandidates()
      .then((data) => {
        if (cancelled) return
        setCandidates(data)
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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return candidates
      .filter((c) => {
        if (!q) return true
        const role = latestRole(c.experience)
        return [c.fullName, c.email, c.address.city, c.address.state, role?.title ?? '', ...c.skills].some((v) =>
          v.toLowerCase().includes(q),
        )
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.fullName.localeCompare(b.fullName))
  }, [candidates, query])

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const page = Math.min(requestedPage, totalPages)
  const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <h1>Candidates</h1>
          <p className="auth-subtitle">View and manage candidate profiles.</p>
        </div>
        <Link to="/candidates/new" className="btn btn-primary btn-icon">
          <Icon name="plus" size={18} />
          Create profile
        </Link>
      </div>

      <div className="toolbar toolbar-single">
        <label className="search-box">
          <Icon name="search" size={18} />
          <input
            type="search"
            placeholder="Search by name, email, city, role or skill"
            aria-label="Search candidates"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {loadState === 'loading' && (
        <div className="company-grid" aria-busy="true" aria-label="Loading candidates">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="company-card skeleton-card" key={i}>
              <div className="skeleton skeleton-logo" style={{ borderRadius: '50%' }} />
              <div className="skeleton skeleton-line" style={{ width: '60%' }} />
              <div className="skeleton skeleton-line" style={{ width: '40%' }} />
            </div>
          ))}
        </div>
      )}

      {loadState === 'error' && (
        <div className="panel state-panel" role="alert">
          <h2>Couldn't load candidates</h2>
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
              ? 'No candidates found'
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, visible.length)} of ${visible.length} ${visible.length === 1 ? 'candidate' : 'candidates'}`}
          </p>

          {visible.length === 0 ? (
            <div className="panel state-panel">
              <h2>{query ? 'No matching candidates' : 'No candidates yet'}</h2>
              <p className="muted">{query ? 'Try a different search.' : 'Create the first candidate profile.'}</p>
              {query ? (
                <button type="button" className="btn btn-outline" onClick={clearAll}>Clear search</button>
              ) : (
                <Link to="/candidates/new" className="btn btn-primary">Create profile</Link>
              )}
            </div>
          ) : (
            <div className="company-grid">
              {pageItems.map((c) => {
                const role = latestRole(c.experience)
                const months = totalExperienceMonths(c.experience)
                return (
                  <article className="company-card candidate-card" key={c.id}>
                    <div className="company-card-head">
                      <Avatar src={c.photo} name={c.fullName} size={52} />
                      <div className="company-card-title">
                        <Link to={`/candidates/${c.id}`} className="company-name">{c.fullName}</Link>
                        <span className="candidate-role">{role ? `${role.title} · ${role.company}` : 'Fresher'}</span>
                      </div>
                    </div>
                    <ul className="company-meta">
                      <li><Icon name="pin" size={16} />{c.address.city}, {c.address.state}</li>
                      <li><Icon name="briefcase" size={16} />{months ? formatDuration(months) : 'No experience yet'}</li>
                      <li><Icon name="mail" size={16} /><span className="truncate">{c.email}</span></li>
                    </ul>
                    <div className="job-skills">
                      {c.skills.slice(0, 3).map((s) => <span className="skill-tag static" key={s}>{s}</span>)}
                      {c.skills.length > 3 && <span className="more-skills">+{c.skills.length - 3}</span>}
                    </div>
                    <div className="card-actions candidate-actions">
                      <Link to={`/candidates/${c.id}`} className="btn btn-outline btn-sm">
                        <Icon name="eye" size={16} /> View
                      </Link>
                      <Link to={`/candidates/${c.id}/edit`} className="btn btn-outline btn-sm">
                        <Icon name="edit" size={16} /> Edit
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={changePage} />
        </>
      )}
    </AdminLayout>
  )
}
