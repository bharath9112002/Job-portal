import { useEffect, useRef, useState } from 'react'
import { fetchCandidates } from '../candidates/api'
import { useApplications } from '../hooks/useApplications'
import { Avatar } from './Avatar'

const MAX_COVER = 1000

/**
 * Apply for a job on behalf of a candidate profile.
 * Candidates who already have an active application for this job can't be picked again.
 */
export function ApplyDialog({ open, job, onClose, onApplied }) {
  const ref = useRef(null)
  const { applications, apply } = useApplications()

  const [candidates, setCandidates] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [candidateId, setCandidateId] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Load candidate profiles the first time the dialog opens.
  useEffect(() => {
    if (!open || candidates) return
    let cancelled = false
    fetchCandidates()
      .then((list) => !cancelled && setCandidates([...list].sort((a, b) => a.fullName.localeCompare(b.fullName))))
      .catch((err) => !cancelled && setLoadError(err.message))
    return () => {
      cancelled = true
    }
  }, [open, candidates])

  const appliedIds = new Set(
    applications.filter((a) => a.jobId === job.id && a.status !== 'withdrawn').map((a) => a.candidateId),
  )
  const selected = candidates?.find((c) => String(c.id) === candidateId)

  const close = () => {
    if (saving) return
    setCandidateId('')
    setCoverLetter('')
    setErrors({})
    setSaveError('')
    onClose()
  }

  const submit = async (e) => {
    e.preventDefault()
    const found = {
      candidateId: candidateId ? undefined : 'Choose a candidate',
      coverLetter: coverLetter.length > MAX_COVER ? `Keep it under ${MAX_COVER} characters` : undefined,
    }
    setErrors(found)
    if (Object.values(found).some(Boolean)) return

    setSaving(true)
    setSaveError('')
    try {
      const created = await apply({
        jobId: job.id,
        jobTitle: job.title,
        companyId: job.companyId,
        companyName: job.companyName,
        candidateId: selected.id,
        candidateName: selected.fullName,
        candidateEmail: selected.email,
        coverLetter: coverLetter.trim(),
      })
      setSaving(false)
      setCandidateId('')
      setCoverLetter('')
      onApplied(created)
    } catch (err) {
      setSaveError(err.message)
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={ref}
      className="confirm-dialog apply-dialog"
      aria-labelledby="apply-title"
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
    >
      <form onSubmit={submit} noValidate>
        <h2 id="apply-title">Apply for {job.title}</h2>
        <p className="muted apply-sub">{job.companyName} · {job.location}</p>

        {loadError && <div className="alert alert-error" role="alert">{loadError}</div>}

        <div className="field">
          <label htmlFor="apply-candidate">Candidate</label>
          <select
            id="apply-candidate"
            value={candidateId}
            className={errors.candidateId ? 'invalid' : undefined}
            aria-invalid={!!errors.candidateId}
            aria-describedby={errors.candidateId ? 'apply-candidate-error' : undefined}
            disabled={!candidates}
            onChange={(e) => {
              setCandidateId(e.target.value)
              setErrors((er) => ({ ...er, candidateId: undefined }))
              setSaveError('')
            }}
          >
            <option value="">{candidates ? 'Choose a candidate profile' : 'Loading candidates…'}</option>
            {candidates?.map((c) => (
              <option key={c.id} value={c.id} disabled={appliedIds.has(c.id)}>
                {c.fullName}
                {appliedIds.has(c.id) ? ' (already applied)' : ''}
              </option>
            ))}
          </select>
          {errors.candidateId && (
            <p className="field-error" id="apply-candidate-error" role="alert">{errors.candidateId}</p>
          )}
        </div>

        {selected && (
          <div className="apply-candidate">
            <Avatar src={selected.photo} name={selected.fullName} size={40} />
            <div>
              <strong>{selected.fullName}</strong>
              <span className="muted">{selected.email}</span>
              <span className={selected.resume ? 'muted' : 'apply-warn'}>
                {selected.resume ? `Resume: ${selected.resume.name}` : 'No resume on this profile'}
              </span>
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="apply-cover">Cover letter (optional)</label>
          <textarea
            id="apply-cover"
            rows={5}
            value={coverLetter}
            placeholder="Why is this candidate a good fit?"
            className={errors.coverLetter ? 'invalid' : undefined}
            aria-invalid={!!errors.coverLetter}
            onChange={(e) => {
              setCoverLetter(e.target.value)
              setErrors((er) => ({ ...er, coverLetter: undefined }))
            }}
          />
          {errors.coverLetter ? (
            <p className="field-error" role="alert">{errors.coverLetter}</p>
          ) : (
            <p className="field-hint">{coverLetter.length}/{MAX_COVER}</p>
          )}
        </div>

        {saveError && <div className="alert alert-error" role="alert">{saveError}</div>}

        <div className="dialog-actions">
          <button type="button" className="btn btn-outline" onClick={close} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving || !candidates}>
            {saving ? 'Submitting…' : 'Submit application'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
