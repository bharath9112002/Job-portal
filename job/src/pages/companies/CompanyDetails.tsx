import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, deleteCompany, fetchCompany } from '../../companies/api'
import type { Company } from '../../companies/types'
import { AdminLayout } from '../../components/AdminLayout'
import { CompanyLogo } from '../../components/CompanyLogo'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { FlashMessage } from '../../components/FlashMessage'
import { Icon } from '../../components/Icon'
import { useFlash } from '../../hooks/useFlash'

export default function CompanyDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [company, setCompany] = useState<Company | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [flash, setFlash] = useFlash()

  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchCompany(Number(id))
      .then((c) => !cancelled && setCompany(c))
      .catch((err: ApiError) => !cancelled && setError(err))
    return () => {
      cancelled = true
    }
  }, [id, reloadKey])

  const retry = () => {
    setError(null)
    setCompany(null)
    setReloadKey((k) => k + 1)
  }

  const onDelete = async () => {
    if (!company) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteCompany(company.id)
      navigate('/companies', { replace: true, state: { flash: `"${company.name}" was deleted.` } })
    } catch (err) {
      setDeleteError((err as Error).message)
      setDeleting(false)
    }
  }

  return (
    <AdminLayout>
      <Link to="/companies" className="back-link">
        <Icon name="arrow-left" size={16} /> Back to companies
      </Link>

      {error && (
        <div className="panel state-panel" role="alert">
          <h2>{error.status === 404 ? 'Company not found' : "Couldn't load this company"}</h2>
          <p className="muted">{error.message}</p>
          {error.status === 404 ? (
            <Link to="/companies" className="btn btn-primary">View all companies</Link>
          ) : (
            <button type="button" className="btn btn-primary" onClick={retry}>Try again</button>
          )}
        </div>
      )}

      {!error && !company && (
        <div className="panel" aria-busy="true" aria-label="Loading company">
          <div className="details-head">
            <div className="skeleton skeleton-logo-lg" />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-line" style={{ width: '40%', height: 24 }} />
              <div className="skeleton skeleton-line" style={{ width: '20%' }} />
            </div>
          </div>
          <div className="skeleton skeleton-line" style={{ width: '90%' }} />
          <div className="skeleton skeleton-line" style={{ width: '75%' }} />
        </div>
      )}

      {company && (
        <>
          <FlashMessage message={flash} onDismiss={() => setFlash('')} />

          <div className="panel">
            <div className="details-head">
              <CompanyLogo src={company.logo} name={company.name} size={80} />
              <div className="details-title">
                <h1>{company.name}</h1>
                <span className="chip">{company.industry}</span>
              </div>
              <div className="details-actions">
                <Link to={`/companies/${company.id}/edit`} className="btn btn-outline btn-icon">
                  <Icon name="edit" size={16} /> Edit
                </Link>
                <button
                  type="button"
                  className="btn btn-outline btn-icon btn-danger-outline"
                  onClick={() => {
                    setDeleteError('')
                    setConfirming(true)
                  }}
                >
                  <Icon name="trash" size={16} /> Delete
                </button>
              </div>
            </div>

            <dl className="details-grid">
              <div>
                <dt><Icon name="pin" size={16} /> Location</dt>
                <dd>{company.location}</dd>
              </div>
              <div>
                <dt><Icon name="users" size={16} /> Employees</dt>
                <dd>{company.employees.toLocaleString('en-IN')}</dd>
              </div>
              <div>
                <dt><Icon name="globe" size={16} /> Website</dt>
                <dd>
                  <a href={company.website} target="_blank" rel="noopener noreferrer">
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                </dd>
              </div>
              <div>
                <dt><Icon name="mail" size={16} /> Contact email</dt>
                <dd><a href={`mailto:${company.email}`}>{company.email}</a></dd>
              </div>
            </dl>

            <h2 className="details-section-title">About</h2>
            <p className="details-description">{company.description}</p>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirming}
        title="Delete company?"
        message={`"${company?.name}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        busy={deleting}
        error={deleteError}
        onConfirm={onDelete}
        onCancel={() => setConfirming(false)}
      />
    </AdminLayout>
  )
}
