import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { STATUSES, canWithdraw } from '../../applications/model'
import { formatDate } from '../../jobs/types'
import { AdminLayout } from '../../components/AdminLayout'
import { AppStatusBadge } from '../../components/AppStatusBadge'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { FlashMessage } from '../../components/FlashMessage'
import { Icon } from '../../components/Icon'
import { useApplications } from '../../hooks/useApplications'
import { useMyProfile } from '../../hooks/useMyProfile'

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

/** One of the candidate's own applications: status history, cover letter and withdraw (UI only). */
export default function MyApplicationDetails() {
  const { id } = useParams()
  const me = useMyProfile()
  const { applications, loadState, withdraw } = useApplications()
  // Only show applications that belong to this candidate.
  const app = applications.find((a) => a.id === Number(id) && a.candidateId === me.profile?.id)

  const [flash, setFlash] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const onWithdraw = async () => {
    setBusy(true)
    setError('')
    try {
      await withdraw(app.id, reason.trim())
      setConfirming(false)
      setReason('')
      setFlash('Your application was withdrawn.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const loading = loadState === 'loading' || me.loadState === 'loading'

  return (
    <AdminLayout>
      <Link to="/candidate/applications" className="back-link">
        <Icon name="arrow-left" size={16} /> Back to my applications
      </Link>

      {loading && (
        <div className="panel" aria-busy="true" aria-label="Loading application">
          <div className="skeleton skeleton-line" style={{ width: '40%', height: 24 }} />
          <div className="skeleton skeleton-line" style={{ width: '60%' }} />
        </div>
      )}

      {!loading && !app && (
        <div className="panel state-panel" role="alert">
          <h2>Application not found</h2>
          <p className="muted">It doesn’t exist or isn’t one of yours.</p>
          <Link to="/candidate/applications" className="btn btn-primary">My applications</Link>
        </div>
      )}

      {app && (
        <>
          <FlashMessage message={flash} onDismiss={() => setFlash('')} />

          <div className="panel app-header">
            <div className="app-header-main">
              <AppStatusBadge status={app.status} />
              <h1>{app.jobTitle}</h1>
              <p className="result-company">{app.companyName} · applied {formatDate(app.appliedAt)}</p>
            </div>
            <div className="details-actions">
              <Link to={`/candidate/jobs/${app.jobId}`} className="btn btn-outline btn-icon">
                <Icon name="briefcase" size={16} /> View job
              </Link>
              {canWithdraw(app) && (
                <button
                  type="button"
                  className="btn btn-outline btn-icon btn-danger-outline"
                  onClick={() => {
                    setError('')
                    setConfirming(true)
                  }}
                >
                  <Icon name="x" size={16} /> Withdraw application
                </button>
              )}
            </div>
          </div>

          <div className="profile-layout">
            <div className="profile-main">
              <section className="panel">
                <h2 className="details-section-title">Progress</h2>
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
            </div>
            <aside className="profile-side">
              <section className="panel">
                <h2 className="details-section-title">Your cover letter</h2>
                {app.coverLetter ? (
                  <p className="details-description">{app.coverLetter}</p>
                ) : (
                  <p className="muted">You didn’t include a cover letter.</p>
                )}
              </section>
              <section className="panel">
                <h2 className="details-section-title">What’s next?</h2>
                <p className="muted">{nextStepText(app.status)}</p>
              </section>
            </aside>
          </div>

          <ConfirmDialog
            open={confirming}
            title="Withdraw your application?"
            message={`Your application for ${app.jobTitle} will be marked as withdrawn. You can apply again later while the job is open.`}
            confirmLabel="Withdraw"
            busyLabel="Withdrawing…"
            busy={busy}
            error={error}
            onConfirm={onWithdraw}
            onCancel={() => setConfirming(false)}
          >
            <div className="field">
              <label htmlFor="withdraw-reason">Reason (optional)</label>
              <input
                id="withdraw-reason"
                value={reason}
                maxLength={200}
                placeholder="e.g. Accepted another offer"
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <p className="field-hint dialog-note">Demo only — the employer isn’t notified.</p>
          </ConfirmDialog>
        </>
      )}
    </AdminLayout>
  )
}

function nextStepText(status) {
  const label = STATUSES[status]?.label
  switch (status) {
    case 'applied':
      return 'The employer will review your application soon.'
    case 'review':
    case 'shortlisted':
      return `Your application is ${label.toLowerCase()}. Keep an eye out for an interview invite.`
    case 'interview':
      return 'You’re in the interview stage — good luck! Check the notes above for details.'
    case 'offered':
      return 'You have an offer! The employer will be in touch about next steps.'
    case 'hired':
      return 'Congratulations on the new role!'
    case 'rejected':
      return 'This one didn’t work out. There are more open jobs waiting for you.'
    default:
      return 'This application was withdrawn.'
  }
}
