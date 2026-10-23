import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { JobError, deleteJob, fetchJob, setJobStatus } from '../../jobs/api'
import { formatDate, formatSalary, isPastDeadline, todayIso, type Job } from '../../jobs/types'
import { AdminLayout } from '../../components/AdminLayout'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { FlashMessage } from '../../components/FlashMessage'
import { Icon } from '../../components/Icon'
import { useFlash } from '../../hooks/useFlash'

function daysLeft(deadline: string) {
  const ms = new Date(`${deadline}T00:00:00`).getTime() - new Date(`${todayIso()}T00:00:00`).getTime()
  return Math.round(ms / 86_400_000)
}

export default function JobDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState<JobError | null>(null)
  const [flash, setFlash] = useFlash()

  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchJob(Number(id))
      .then((j) => !cancelled && setJob(j))
      .catch((err: JobError) => !cancelled && setError(err))
    return () => {
      cancelled = true
    }
  }, [id])

  const toggleStatus = async () => {
    if (!job) return
    setBusy(true)
    setActionError('')
    try {
      const updated = await setJobStatus(job.id, job.status === 'open' ? 'closed' : 'open')
      setJob(updated)
      setFlash(updated.status === 'open' ? 'Job reopened.' : 'Job closed. It no longer accepts applications.')
    } catch (err) {
      setActionError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const onDelete = async () => {
    if (!job) return
    setBusy(true)
    setActionError('')
    try {
      await deleteJob(job.id)
      navigate('/jobs', { replace: true, state: { flash: `"${job.title}" was deleted.` } })
    } catch (err) {
      setActionError((err as Error).message)
      setBusy(false)
    }
  }

  const remaining = job ? daysLeft(job.deadline) : 0

  return (
    <AdminLayout>
      <Link to="/jobs" className="back-link">
        <Icon name="arrow-left" size={16} /> Back to jobs
      </Link>

      {error && (
        <div className="panel state-panel" role="alert">
          <h2>{error.status === 404 ? 'Job not found' : "Couldn't load this job"}</h2>
          <p className="muted">{error.message}</p>
          <Link to="/jobs" className="btn btn-primary">View all jobs</Link>
        </div>
      )}

      {!error && !job && (
        <div className="panel" aria-busy="true" aria-label="Loading job">
          <div className="skeleton skeleton-line" style={{ width: '45%', height: 26 }} />
          <div className="skeleton skeleton-line" style={{ width: '25%' }} />
          <div className="skeleton skeleton-line" style={{ width: '80%' }} />
        </div>
      )}

      {job && (
        <>
          <FlashMessage message={flash} onDismiss={() => setFlash('')} />
          {actionError && !confirming && <div className="alert alert-error" role="alert">{actionError}</div>}

          <div className="panel">
            <div className="details-head">
              <div className="details-title">
                <span className={`status-badge ${job.status}`}>
                  <Icon name={job.status === 'open' ? 'check' : 'x'} size={12} />
                  {job.status === 'open' ? 'Open' : 'Closed'}
                </span>
                <h1>{job.title}</h1>
                <Link to={`/companies/${job.companyId}`} className="job-company">
                  <Icon name="building" size={16} /> {job.companyName}
                </Link>
              </div>
              <div className="details-actions">
                <Link to={`/jobs/${job.id}/edit`} className="btn btn-outline btn-icon">
                  <Icon name="edit" size={16} /> Edit
                </Link>
                <button type="button" className="btn btn-outline btn-icon" onClick={toggleStatus} disabled={busy}>
                  <Icon name={job.status === 'open' ? 'x' : 'check'} size={16} />
                  {job.status === 'open' ? 'Close job' : 'Reopen'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-icon btn-danger-outline"
                  onClick={() => {
                    setActionError('')
                    setConfirming(true)
                  }}
                >
                  <Icon name="trash" size={16} /> Delete
                </button>
              </div>
            </div>

            <dl className="details-grid">
              <div><dt><Icon name="grid" size={16} /> Category</dt><dd>{job.category}</dd></div>
              <div><dt><Icon name="briefcase" size={16} /> Employment type</dt><dd>{job.employmentType}</dd></div>
              <div><dt><Icon name="users" size={16} /> Experience level</dt><dd>{job.experienceLevel}</dd></div>
              <div><dt><Icon name="file" size={16} /> Salary range</dt><dd>{formatSalary(job.salaryMin, job.salaryMax)} per year</dd></div>
              <div><dt><Icon name="pin" size={16} /> Location</dt><dd>{job.location}</dd></div>
              <div>
                <dt><Icon name="calendar" size={16} /> Application deadline</dt>
                <dd>
                  {formatDate(job.deadline)}
                  <span className={isPastDeadline(job.deadline) ? 'deadline-note expired' : 'deadline-note'}>
                    {remaining < 0
                      ? `Passed ${-remaining} day${remaining === -1 ? '' : 's'} ago`
                      : remaining === 0
                        ? 'Closes today'
                        : `${remaining} day${remaining === 1 ? '' : 's'} left`}
                  </span>
                </dd>
              </div>
            </dl>

            <h2 className="details-section-title">Required skills</h2>
            <div className="job-skills">
              {job.skills.map((s) => <span className="skill-tag static" key={s}>{s}</span>)}
            </div>


            <p className="muted posted-on">Posted on {formatDate(job.postedAt)}</p>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirming}
        title="Delete job posting?"
        message={`"${job?.title}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        busy={busy}
        error={actionError}
        onConfirm={onDelete}
        onCancel={() => setConfirming(false)}
      />
    </AdminLayout>
  )
}
