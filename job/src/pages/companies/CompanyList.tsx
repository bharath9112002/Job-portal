import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { deleteCompany, fetchCompanies } from '../../companies/api'
import type { Company } from '../../companies/types'
import { AdminLayout } from '../../components/AdminLayout'
import { CompanyLogo } from '../../components/CompanyLogo'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Icon } from '../../components/Icon'
import { Pagination } from '../../components/Pagination'

const PAGE_SIZE = 9

type Status = 'loading' | 'error' | 'ready'

export default function CompanyList() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()

  // Search, filter, sort and page live in the URL so they survive reloads and the back button.
  const query = params.get('q') ?? ''
  const industry = params.get('industry') ?? ''
  const sort = params.get('sort') === 'desc' ? 'desc' : 'asc'
  const requestedPage = Math.max(1, Number(params.get('page')) || 1)

  const [companies, setCompanies] = useState<Company[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  // The search box keeps its own state so fast typing isn't lost; the URL follows after a short pause.
  const [search, setSearch] = useState(query)
  useEffect(() => {
    if (search === query) return
    const t = setTimeout(() => setParam('q', search), 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])
  // Follow the URL when it changes from outside (back/forward, "Clear filters").
  useEffect(() => setSearch(query), [query])

  const [flash, setFlash] = useState<string>((location.state as { flash?: string } | null)?.flash ?? '')
  const [toDelete, setToDelete] = useState<Company | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Clear the one-time flash message from history so it doesn't reappear on refresh.
  useEffect(() => {
    if ((location.state as { flash?: string } | null)?.flash) {
      navigate(location.pathname + location.search, { replace: true, state: null })
    }
  }, [location, navigate])

  useEffect(() => {
    let cancelled = false
    fetchCompanies()
      .then((data) => {
        if (cancelled) return
        setCompanies(data)
        setStatus('ready')
      })
      .catch((err: Error) => {
        if (cancelled) return
        setError(err.message)
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const retry = () => {
    setStatus('loading')
    setError('')
    setReloadKey((k) => k + 1)
  }

  const industries = useMemo(
    () => [...new Set(companies.map((c) => c.industry))].sort(),
    [companies],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return companies
      .filter((c) => !industry || c.industry === industry)
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q),
      )
      .sort((a, b) => (sort === 'asc' ? 1 : -1) * a.name.localeCompare(b.name))
  }, [companies, query, industry, sort])

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const page = Math.min(requestedPage, totalPages)
  const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const setParam = (key: string, value: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        if (key !== 'page') next.delete('page')
        return next
      },
      { replace: key !== 'page' },
    )
  }

  const changePage = (p: number) => {
    setParam('page', p === 1 ? '' : String(p))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteCompany(toDelete.id)
      setCompanies((list) => list.filter((c) => c.id !== toDelete.id))
      setFlash(`"${toDelete.name}" was deleted.`)
      setToDelete(null)
    } catch (err) {
      setDeleteError((err as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  const hasFilters = !!(query || industry)

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <h1>Companies</h1>
          <p className="auth-subtitle">Manage employers registered on the portal.</p>
        </div>
        <Link to="/companies/new" className="btn btn-primary btn-icon">
          <Icon name="plus" size={18} />
          Add company
        </Link>
      </div>

      {flash && (
        <div className="alert alert-success alert-dismissible" role="status">
          <span>{flash}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setFlash('')}>
            <Icon name="x" size={16} />
          </button>
        </div>
      )}

      <div className="toolbar">
        <label className="search-box">
          <Icon name="search" size={18} />
          <input
            type="search"
            placeholder="Search by name, industry or location"
            aria-label="Search companies"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter by industry"
          value={industry}
          onChange={(e) => setParam('industry', e.target.value)}
          disabled={status !== 'ready'}
        >
          <option value="">All industries</option>
          {industries.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        <select
          aria-label="Sort by company name"
          value={sort}
          onChange={(e) => setParam('sort', e.target.value === 'asc' ? '' : e.target.value)}
        >
          <option value="asc">Name: A → Z</option>
          <option value="desc">Name: Z → A</option>
        </select>
      </div>

      {status === 'loading' && (
        <div className="company-grid" aria-busy="true" aria-label="Loading companies">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="company-card skeleton-card" key={i}>
              <div className="skeleton skeleton-logo" />
              <div className="skeleton skeleton-line" style={{ width: '70%' }} />
              <div className="skeleton skeleton-line" style={{ width: '45%' }} />
              <div className="skeleton skeleton-line" style={{ width: '55%' }} />
            </div>
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="panel state-panel" role="alert">
          <h2>Couldn't load companies</h2>
          <p className="muted">{error}</p>
          <button type="button" className="btn btn-primary" onClick={retry}>Try again</button>
        </div>
      )}

      {status === 'ready' && (
        <>
          <p className="result-count">
            {visible.length === 0
              ? 'No companies found'
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, visible.length)} of ${visible.length} ${visible.length === 1 ? 'company' : 'companies'}`}
          </p>

          {visible.length === 0 ? (
            <div className="panel state-panel">
              <h2>No matching companies</h2>
              <p className="muted">
                {hasFilters ? 'Try a different search or industry.' : 'Add your first company to get started.'}
              </p>
              {hasFilters && (
                <button type="button" className="btn btn-outline" onClick={() => setParams({})}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="company-grid">
              {pageItems.map((c) => (
                <article className="company-card" key={c.id}>
                  <div className="company-card-head">
                    <CompanyLogo src={c.logo} name={c.name} />
                    <div className="company-card-title">
                      <Link to={`/companies/${c.id}`} className="company-name">{c.name}</Link>
                      <span className="chip">{c.industry}</span>
                    </div>
                  </div>
                  <ul className="company-meta">
                    <li><Icon name="pin" size={16} />{c.location}</li>
                    <li><Icon name="users" size={16} />{c.employees.toLocaleString('en-IN')} employees</li>
                    <li><Icon name="globe" size={16} /><span className="truncate">{c.website.replace(/^https?:\/\/(www\.)?/, '')}</span></li>
                  </ul>
                  <div className="card-actions">
                    <Link to={`/companies/${c.id}`} className="btn btn-outline btn-sm">
                      <Icon name="eye" size={16} /> View
                    </Link>
                    <Link to={`/companies/${c.id}/edit`} className="btn btn-outline btn-sm">
                      <Icon name="edit" size={16} /> Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm btn-danger-outline"
                      onClick={() => {
                        setDeleteError('')
                        setToDelete(c)
                      }}
                    >
                      <Icon name="trash" size={16} /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={changePage} />
        </>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete company?"
        message={`"${toDelete?.name}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </AdminLayout>
  )
}
