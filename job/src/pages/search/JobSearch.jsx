import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { fetchJobs } from '../../jobs/api'
import { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, formatSalary, isAcceptingApplications, postedAgo } from '../../jobs/types'
import { AdminLayout } from '../../components/AdminLayout'
import { Icon } from '../../components/Icon'
import { Pagination } from '../../components/Pagination'
import { SaveJobButton } from '../../components/SaveJobButton'
import { useListParams } from '../../hooks/useListParams'
import { usePortal } from '../../hooks/usePortal'

const PAGE_SIZE = 6
const SALARY_STEPS = [25000, 50000, 75000, 100000, 125000, 150000, 200000]

const SORTS = {
  latest: { label: 'Latest jobs', compare: (a, b) => b.postedAt.localeCompare(a.postedAt) },
  salary: { label: 'Highest salary', compare: (a, b) => b.salaryMax - a.salaryMax },
  closing: { label: 'Closing soon', compare: (a, b) => a.deadline.localeCompare(b.deadline) },
}

const fmtK = (n) => `$${n / 1000}k`

/** Whether a job passes every filter, optionally ignoring one (used for the per-option counts). */
function matches(job, f, ignore) {
  const q = f.q.trim().toLowerCase()
  if (
    q &&
    !job.title.toLowerCase().includes(q) &&
    !job.companyName.toLowerCase().includes(q) &&
    !job.category.toLowerCase().includes(q) &&
    !job.skills.some((s) => s.toLowerCase().includes(q))
  )
    return false
  if (ignore !== 'location' && f.location && job.location !== f.location) return false
  if (ignore !== 'types' && f.types.length && !f.types.includes(job.employmentType)) return false
  if (ignore !== 'levels' && f.levels.length && !f.levels.includes(job.experienceLevel)) return false
  // A job matches a salary range if its own range overlaps it.
  if (ignore !== 'salary') {
    if (f.salaryMin && job.salaryMax < f.salaryMin) return false
    if (f.salaryMax && job.salaryMin > f.salaryMax) return false
  }
  return true
}

const splitList = (v) => (v ? v.split(',') : [])

export default function JobSearch() {
  const location = useLocation()
  const { isCandidate, jobsPath } = usePortal()
  const { get, setParam, setMany, query, search, setSearch, requestedPage, changePage, clearAll } = useListParams()

  const filters = {
    q: query,
    location: get('location'),
    types: splitList(get('type')),
    levels: splitList(get('level')),
    salaryMin: Number(get('smin')) || 0,
    salaryMax: Number(get('smax')) || 0,
  }
  const sort = SORTS[get('sort')] ? get('sort') : 'latest'

  const [jobs, setJobs] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchJobs()
      .then((all) => {
        if (cancelled) return
        setJobs(all.filter(isAcceptingApplications))
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

  const locations = useMemo(() => {
    const unique = [...new Set(jobs.map((j) => j.location))].sort()
    // Keep "Remote" at the top of the list.
    return unique.includes('Remote') ? ['Remote', ...unique.filter((l) => l !== 'Remote')] : unique
  }, [jobs])

  const results = jobs.filter((j) => matches(j, filters)).sort(SORTS[sort].compare)
  const countFor = (facet, test) => jobs.filter((j) => matches(j, filters, facet) && test(j)).length

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const page = Math.min(requestedPage, totalPages)
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleInList = (key, current, value) => {
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    setParam(key, next.join(','))
  }

  // Chips summarising the active filters, each removable on its own.
  const chips = [
    ...(filters.q ? [{ label: `"${filters.q}"`, clear: () => setSearch('') }] : []),
    ...(filters.location ? [{ label: filters.location, clear: () => setParam('location', '') }] : []),
    ...filters.types.map((t) => ({ label: t, clear: () => toggleInList('type', filters.types, t) })),
    ...filters.levels.map((l) => ({
      label: l.replace(/ \(.*\)/, ''),
      clear: () => toggleInList('level', filters.levels, l),
    })),
    ...(filters.salaryMin || filters.salaryMax
      ? [
          {
            label:
              filters.salaryMin && filters.salaryMax
                ? `${fmtK(filters.salaryMin)} – ${fmtK(filters.salaryMax)}`
                : filters.salaryMin
                  ? `From ${fmtK(filters.salaryMin)}`
                  : `Up to ${fmtK(filters.salaryMax)}`,
            clear: () => setMany({ smin: '', smax: '' }),
          },
        ]
      : []),
  ]
  const filterCount = chips.length - (filters.q ? 1 : 0)
  const salaryInvalid = !!(filters.salaryMin && filters.salaryMax && filters.salaryMin > filters.salaryMax)

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <h1>{isCandidate ? 'Find Jobs' : 'Job Search'}</h1>
          <p className="auth-subtitle">Browse open positions across all companies.</p>
        </div>
      </div>

      <div className="search-hero">
        <label className="search-box search-box-lg">
          <Icon name="search" size={20} />
          <input
            type="search"
            placeholder="Job title, company, skill or category"
            aria-label="Search jobs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn btn-outline filters-toggle"
          aria-expanded={filtersOpen}
          aria-controls="search-filters"
          onClick={() => setFiltersOpen((o) => !o)}
        >
          Filters{filterCount ? ` (${filterCount})` : ''}
        </button>
      </div>

      <div className="search-layout">
        <aside
          id="search-filters"
          className={filtersOpen ? 'filters-panel open' : 'filters-panel'}
          aria-label="Filters"
        >
          <div className="filter-group">
            <label className="filter-title" htmlFor="filter-location">
              Location
            </label>
            <select
              id="filter-location"
              value={filters.location}
              onChange={(e) => setParam('location', e.target.value)}
              disabled={loadState !== 'ready'}
            >
              <option value="">Any location</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l} ({countFor('location', (j) => j.location === l)})
                </option>
              ))}
            </select>
          </div>

          <fieldset className="filter-group">
            <legend className="filter-title">Job type</legend>
            {EMPLOYMENT_TYPES.map((t) => (
              <label className="check-row" key={t}>
                <input
                  type="checkbox"
                  checked={filters.types.includes(t)}
                  onChange={() => toggleInList('type', filters.types, t)}
                />

                <span>{t}</span>
                <span className="check-count">
                  {loadState === 'ready' ? countFor('types', (j) => j.employmentType === t) : ''}
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset className="filter-group">
            <legend className="filter-title">Experience level</legend>
            {EXPERIENCE_LEVELS.map((l) => (
              <label className="check-row" key={l}>
                <input
                  type="checkbox"
                  checked={filters.levels.includes(l)}
                  onChange={() => toggleInList('level', filters.levels, l)}
                />

                <span>{l}</span>
                <span className="check-count">
                  {loadState === 'ready' ? countFor('levels', (j) => j.experienceLevel === l) : ''}
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset className="filter-group">
            <legend className="filter-title">Salary range (per year)</legend>
            <div className="salary-selects">
              <select
                aria-label="Minimum salary"
                value={filters.salaryMin || ''}
                onChange={(e) => setParam('smin', e.target.value)}
              >
                <option value="">No min</option>
                {SALARY_STEPS.map((s) => (
                  <option key={s} value={s}>
                    {fmtK(s)}
                  </option>
                ))}
              </select>
              <span aria-hidden="true">to</span>
              <select
                aria-label="Maximum salary"
                value={filters.salaryMax || ''}
                onChange={(e) => setParam('smax', e.target.value)}
              >
                <option value="">No max</option>
                {SALARY_STEPS.map((s) => (
                  <option key={s} value={s}>
                    {fmtK(s)}
                  </option>
                ))}
              </select>
            </div>
            {salaryInvalid && (
              <p className="field-error" role="alert">
                Minimum is higher than maximum.
              </p>
            )}
          </fieldset>

          {filterCount > 0 && (
            <button type="button" className="btn btn-outline btn-block" onClick={clearAll}>
              Clear all filters
            </button>
          )}
        </aside>

        <section className="search-results" aria-live="polite">
          <div className="results-bar">
            <p className="result-count">
              {loadState !== 'ready'
                ? ' '
                : results.length === 0
                  ? 'No jobs found'
                  : `${results.length} ${results.length === 1 ? 'job' : 'jobs'} found`}
            </p>
            <label className="sort-label">
              Sort by
              <select
                value={sort}
                onChange={(e) => setParam('sort', e.target.value === 'latest' ? '' : e.target.value)}
              >
                {Object.entries(SORTS).map(([key, s]) => (
                  <option key={key} value={key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {chips.length > 0 && (
            <div className="active-chips">
              {chips.map((c) => (
                <button
                  type="button"
                  className="filter-chip"
                  key={c.label}
                  onClick={c.clear}
                  aria-label={`Remove filter ${c.label}`}
                >
                  {c.label} <Icon name="x" size={14} />
                </button>
              ))}
            </div>
          )}

          {loadState === 'loading' && (
            <div className="result-list" aria-busy="true" aria-label="Loading jobs">
              {Array.from({ length: 3 }, (_, i) => (
                <div className="result-card" key={i}>
                  <div className="skeleton skeleton-line" style={{ width: '45%', height: 18 }} />
                  <div className="skeleton skeleton-line" style={{ width: '30%' }} />
                  <div className="skeleton skeleton-line" style={{ width: '70%' }} />
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

          {loadState === 'ready' && results.length === 0 && (
            <div className="panel state-panel">
              <h2>No jobs match your search</h2>
              <p className="muted">
                {jobs.length === 0
                  ? 'There are no open positions right now.'
                  : 'Try removing a filter or searching for something broader.'}
              </p>
              {chips.length > 0 && (
                <button type="button" className="btn btn-outline" onClick={clearAll}>
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {loadState === 'ready' && results.length > 0 && (
            <div className="result-list">
              {pageItems.map((j) => (
                <article className="result-card" key={j.id}>
                  <div className="result-top">
                    <div>
                      <h2 className="result-title">
                        <Link to={`${jobsPath}/${j.id}`} state={{ from: location.search }}>
                          {j.title}
                        </Link>
                      </h2>
                      <p className="result-company">{j.companyName}</p>
                    </div>
                    <span className="result-salary">
                      {formatSalary(j.salaryMin, j.salaryMax)}
                      <small> / yr</small>
                    </span>
                  </div>
                  <ul className="job-facts">
                    <li>
                      <Icon name="pin" size={15} />
                      {j.location}
                    </li>
                    <li>
                      <Icon name="briefcase" size={15} />
                      {j.employmentType}
                    </li>
                    <li>
                      <Icon name="users" size={15} />
                      {j.experienceLevel}
                    </li>
                  </ul>
                  <div className="job-skills">
                    {j.skills.slice(0, 5).map((s) => (
                      <span className="skill-tag static" key={s}>
                        {s}
                      </span>
                    ))}
                    {j.skills.length > 5 && <span className="more-skills">+{j.skills.length - 5} more</span>}
                  </div>
                  <div className="result-foot">
                    <span className="muted">Posted {postedAgo(j.postedAt).toLowerCase()}</span>
                    <span className="saved-actions">
                      <SaveJobButton jobId={j.id} jobTitle={j.title} compact />
                      <Link to={`${jobsPath}/${j.id}`} state={{ from: location.search }} className="btn btn-outline btn-sm">
                        View details
                      </Link>
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {loadState === 'ready' && <Pagination page={page} totalPages={totalPages} onChange={changePage} />}
        </section>
      </div>
    </AdminLayout>
  )
}
