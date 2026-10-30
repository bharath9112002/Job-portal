import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { PIPELINE, STATUSES, canWithdraw } from '../../applications/model'
import { formatDate } from '../../jobs/types'
import { AdminLayout } from '../../components/AdminLayout'
import { AppStatusBadge } from '../../components/AppStatusBadge'
import { Avatar } from '../../components/Avatar'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { FlashMessage } from '../../components/FlashMessage'
import { Icon } from '../../components/Icon'
import { useApplications } from '../../hooks/useApplications'

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

export default function ApplicationDetails() {
  const { id } = useParams()
  const location = useLocation()
  const backTo = `/applications${location.state?.from ?? ''}`
  const { applications, loadState, error, reload, updateStatus, withdraw } = useApplications()
  const app = applications.find((a) => a.id === Number(id))

  const [nextStatus, setNextStatus] = useState('')
  const [note, setNote] = useState('')
  const [statusError, setStatusError] = useState('')
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState('')

  const [confirming, setConfirming] = useState(false)
  const [withdrawReason, setWithdrawReason] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')

  const onUpdate = async (e) => {
    e.preventDefault()
    if (!nextStatus) {
      setStatusError('Choose the new status')
      return
    }
    setSaving(true)
    setStatusError('')
    try {
      await updateStatus(app.id, nextStatus, note.trim())
      setFlash(`Status changed to “${STATUSES[nextStatus].label}”.`)
      setNextStatus('')
      setNote('')
    } catch (err) {
      setStatusError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const onWithdraw = async () => {
    setWithdrawing(true)
    setWithdrawError('')
    try {
      await withdraw(app.id, withdrawReason.trim())
      setConfirming(false)
      setWithdrawReason('')
      setFlash('Application withdrawn.')
    } catch (err) {
      setWithdrawError(err.message)
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <AdminLayout>
      <Link to={backTo} className="back-link">
        <Icon name="arrow-left" size={16} /> Back to applications
      </Link>

      {loadState === 'loading' && (
        <div className="panel" aria-busy="true" aria-label="Loading application">
          <div className="skeleton skeleton-line" style={{ width: '40%', height: 24 }} />
          <div className="skeleton skeleton-line" style={{ width: '60%' }} />
        </div>
      )}

      {loadState === 'error' && (
        <div className="panel state-panel" role="alert">
          <h2>Couldn't load this application</h2>
          <p className="muted">{error}</p>
          <button type="button" className="btn btn-primary" onClick={reload}>Try again</button>
        </div>
      )}

      {loadState === 'ready' && !app && (
        <div className="panel state-panel" role="alert">
          <h2>Application not found</h2>
          <p className="muted">It may have been removed.</p>
          <Link to="/applications" className="btn btn-primary">View all applications</Link>
        </div>
      )}

      {app && (
        <>
          <FlashMessage message={flash} onDismiss={() => setFlash('')} />

          <div className="panel app-header">
            <div className="app-header-main">
              <AppStatusBadge status={app.status} />
              <h1>{app.jobTitle}</h1>
              <p className="result-company">
                {app.companyName} · applied {formatDate(app.appliedAt)}
              </p>
            </div>
            <div className="details-actions">
              <Link to={`/search/${app.jobId}`} className="btn btn-outline btn-icon">
                <Icon name="briefcase" size={16} /> View job
              </Link>
              {canWithdraw(app) && (
                <button
                  type="button"
                  className="btn btn-outline btn-icon btn-danger-outline"
                  onClick={() => {
                    setWithdrawError('')
                    setConfirming(true)
                  }}
                >
                  <Icon name="x" size={16} /> Withdraw
                </button>
              )}
            </div>
          </div>

          <div className="profile-layout">
            <div className="profile-main">
              <section className="panel">
                <h2 className="details-section-title">Status history</h2>
                <ol className="timeline">
                  {[...app.history].reverse().map((h, i) => (
                    <li key={`${h.status}-${h.at}`}>
                      <span className={`timeline-dot${i === 0 ? '' : ' past'}`} aria-hidden="true" />
                      <div>
                        <h3><AppStatusBadge status={h.status} /></h3>
                        <p className="muted timeline-dates">{formatDateTime(h.at)}</p>
                        {h.note && <p className="timeline-desc">{h.note}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="panel">
                <h2 className="details-section-title">Cover letter</h2>
                {app.coverLetter ? (
                  <p className="details-description">{app.coverLetter}</p>
                ) : (
                  <p className="muted">No cover letter was included.</p>
                )}
              </section>
            </div>

            <aside className="profile-side">
              <section className="panel">
                <h2 className="details-section-title">Candidate</h2>
                <div className="aside-company">
                  <Avatar src="" name={app.candidateName} size={44} />
                  <div>
                    <Link to={`/candidates/${app.candidateId}`}><strong>{app.candidateName}</strong></Link>
                    <a href={`mailto:${app.candidateEmail}`} className="muted">{app.candidateEmail}</a>
                  </div>
                </div>
              </section>

              <section className="panel">
                <h2 className="details-section-title">Update status</h2>
                {app.status === 'withdrawn' ? (
                  <p className="muted">This application was withdrawn, so its status can’t be changed.</p>
                ) : (
                  <form onSubmit={onUpdate} noValidate>
                    <div className="field">
                      <label htmlFor="next-status">New status</label>
                      <select
                        id="next-status"
                        value={nextStatus}
                        className={statusError ? 'invalid' : undefined}
                        aria-invalid={!!statusError}
                        onChange={(e) => {
                          setNextStatus(e.target.value)
                          setStatusError('')
                        }}
                      >
                        <option value="">Choose…</option>
                        {PIPELINE.filter((s) => s !== app.status).map((s) => (
                          <option key={s} value={s}>{STATUSES[s].label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="status-note">Note (optional)</label>
                      <textarea
                        id="status-note"
                        rows={3}
                        maxLength={300}
                        placeholder="e.g. Interview on Monday at 11:00"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                    {statusError && <p className="field-error" role="alert">{statusError}</p>}
                    <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
                      {saving ? 'Updating…' : 'Update status'}
                    </button>
                  </form>
                )}
              </section>
            </aside>
          </div>

          <ConfirmDialog
            open={confirming}
            title="Withdraw this application?"
            message={`${app.candidateName}'s application for ${app.jobTitle} will be marked as withdrawn and can't be changed afterwards.`}
            confirmLabel="Withdraw"
            busyLabel="Withdrawing…"
            busy={withdrawing}
            error={withdrawError}
            onConfirm={onWithdraw}
            onCancel={() => setConfirming(false)}
          >
            <div className="field">
              <label htmlFor="withdraw-reason">Reason (optional)</label>
              <input
                id="withdraw-reason"
                value={withdrawReason}
                maxLength={200}
                placeholder="e.g. Accepted another offer"
                onChange={(e) => setWithdrawReason(e.target.value)}
              />
            </div>
            <p className="field-hint dialog-note">Demo only — nobody is notified.</p>
          </ConfirmDialog>
        </>
      )}
    </AdminLayout>
  )
}
