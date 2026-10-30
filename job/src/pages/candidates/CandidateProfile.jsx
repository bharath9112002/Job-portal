import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchCandidate, fetchCandidateByEmail } from '../../candidates/api'
import {
  formatDuration,
  formatFileSize,
  formatMonth,
  latestRole,
  roleMonths,
  totalExperienceMonths,
} from '../../candidates/model'
import { formatDate } from '../../jobs/types'
import { AdminLayout } from '../../components/AdminLayout'
import { AppStatusBadge } from '../../components/AppStatusBadge'
import { Avatar } from '../../components/Avatar'
import { FlashMessage } from '../../components/FlashMessage'
import { Icon } from '../../components/Icon'
import { useApplications } from '../../hooks/useApplications'
import { useAuth } from '../../hooks/useAuth'
import { useFlash } from '../../hooks/useFlash'

/**
 * A candidate profile. Admins view any profile by id; with `self`, a logged-in candidate sees their own
 * (or a prompt to create it).
 */
export default function CandidateProfile({ self = false }) {
  const { id } = useParams()
  const { user } = useAuth()
  const [candidate, setCandidate] = useState(null)
  const [missing, setMissing] = useState(false)
  const [error, setError] = useState(null)
  const [flash, setFlash] = useFlash()
  const { applications, loadState: appsState } = useApplications()
  const applied = applications
    .filter((a) => a.candidateId === candidate?.id)
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
  const applicationPath = (appId) => (self ? `/candidate/applications/${appId}` : `/applications/${appId}`)

  useEffect(() => {
    let cancelled = false
    const request = self ? fetchCandidateByEmail(user.email) : fetchCandidate(Number(id))
    request
      .then((c) => {
        if (cancelled) return
        if (c) setCandidate(c)
        else setMissing(true)
      })
      .catch((err) => !cancelled && setError(err))
    return () => {
      cancelled = true
    }
  }, [id, self, user.email])

  const c = candidate
  const role = c && latestRole(c.experience)
  const totalMonths = c ? totalExperienceMonths(c.experience) : 0
  const experience = c
    ? [...c.experience].sort((a, b) => (a.current === b.current ? b.startDate.localeCompare(a.startDate) : a.current ? -1 : 1))
    : []
  const education = c ? [...c.education].sort((a, b) => b.endYear.localeCompare(a.endYear)) : []

  return (
    <AdminLayout>
      {!self && (
        <Link to="/candidates" className="back-link">
          <Icon name="arrow-left" size={16} /> Back to candidates
        </Link>
      )}

      {missing && (
        <div className="panel state-panel">
          <h2>Create your profile</h2>
          <p className="muted">You need a profile before you can apply for jobs. It only takes a few minutes.</p>
          <Link to="/candidate/profile/edit" className="btn btn-primary">Create profile</Link>
        </div>
      )}

      {error && (
        <div className="panel state-panel" role="alert">
          <h2>{error.status === 404 ? 'Candidate not found' : "Couldn't load this profile"}</h2>
          <p className="muted">{error.message}</p>
          <Link to="/candidates" className="btn btn-primary">View all candidates</Link>
        </div>
      )}

      {!error && !missing && !c && (
        <div className="panel" aria-busy="true" aria-label="Loading profile">
          <div className="skeleton skeleton-line" style={{ width: '40%', height: 26 }} />
          <div className="skeleton skeleton-line" style={{ width: '25%' }} />
          <div className="skeleton skeleton-line" style={{ width: '70%' }} />
        </div>
      )}

      {c && (
        <>
          <FlashMessage message={flash} onDismiss={() => setFlash('')} />

          <div className="panel profile-header">
            <Avatar src={c.photo} name={c.fullName} size={96} />
            <div className="profile-heading">
              <h1>{c.fullName}</h1>
              <p className="profile-role">
                {role ? `${role.title} at ${role.company}` : 'Fresher — no work experience yet'}
              </p>
              <ul className="job-facts">
                <li><Icon name="pin" size={15} />{c.address.city}, {c.address.state}</li>
                <li><Icon name="briefcase" size={15} />{totalMonths ? `${formatDuration(totalMonths)} experience` : 'Fresher'}</li>
              </ul>
            </div>
            <Link
              to={self ? '/candidate/profile/edit' : `/candidates/${c.id}/edit`}
              className="btn btn-primary btn-icon profile-edit"
            >
              <Icon name="edit" size={16} /> Edit profile
            </Link>
          </div>

          <div className="profile-layout">
            <div className="profile-main">
              <section className="panel">
                <h2 className="details-section-title">Skills</h2>
                <div className="job-skills">
                  {c.skills.map((s) => <span className="skill-tag static" key={s}>{s}</span>)}
                </div>
              </section>

              <section className="panel">
                <h2 className="details-section-title">Experience</h2>
                {experience.length === 0 ? (
                  <p className="muted">No work experience added.</p>
                ) : (
                  <ol className="timeline">
                    {experience.map((x) => (
                      <li key={x.id}>
                        <span className="timeline-dot" aria-hidden="true" />
                        <div>
                          <h3>{x.title}</h3>
                          <p className="timeline-org">{x.company}</p>
                          <p className="muted timeline-dates">
                            {formatMonth(x.startDate)} – {x.current ? 'Present' : formatMonth(x.endDate)} ·{' '}
                            {formatDuration(roleMonths(x))}
                          </p>
                          {x.description && <p className="timeline-desc">{x.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <section className="panel">
                <h2 className="details-section-title">Education</h2>
                <ol className="timeline">
                  {education.map((x) => (
                    <li key={x.id}>
                      <span className="timeline-dot" aria-hidden="true" />
                      <div>
                        <h3>
                          {x.degree}
                          {x.fieldOfStudy && `, ${x.fieldOfStudy}`}
                        </h3>
                        <p className="timeline-org">{x.institution}</p>
                        <p className="muted timeline-dates">
                          {x.startYear} – {x.endYear}
                          {x.grade && ` · ${x.grade}`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <aside className="profile-side">
              <section className="panel">
                <h2 className="details-section-title">Contact</h2>
                <dl className="contact-list">
                  <div>
                    <dt><Icon name="mail" size={16} /> Email</dt>
                    <dd><a href={`mailto:${c.email}`}>{c.email}</a></dd>
                  </div>
                  <div>
                    <dt><Icon name="phone" size={16} /> Mobile</dt>
                    <dd><a href={`tel:${c.mobile.replace(/[\s()-]/g, '')}`}>{c.mobile}</a></dd>
                  </div>
                  <div>
                    <dt><Icon name="pin" size={16} /> Address</dt>
                    <dd>
                      {c.address.line}
                      <br />
                      {c.address.city}, {c.address.state} {c.address.postalCode}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="panel">
                <h2 className="details-section-title">Resume</h2>
                {c.resume ? (
                  <div className="resume-card compact">
                    <span className="resume-icon"><Icon name="file" size={20} /></span>
                    <div className="resume-info">
                      <span className="resume-name">{c.resume.name}</span>
                      <span className="muted">
                        {formatFileSize(c.resume.size)} · added {formatDate(c.resume.addedAt)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="muted">No resume uploaded.</p>
                )}
              </section>

              <section className="panel">
                <h2 className="details-section-title">Applied jobs</h2>
                {appsState !== 'ready' ? (
                  <p className="muted">{appsState === 'loading' ? 'Loading…' : 'Applications could not be loaded.'}</p>
                ) : applied.length === 0 ? (
                  <p className="muted">No applications yet.</p>
                ) : (
                  <ul className="applied-list">
                    {applied.map((a) => (
                      <li key={a.id}>
                        <Link to={applicationPath(a.id)} className="applied-title">{a.jobTitle}</Link>
                        <span className="muted">{a.companyName} · {formatDate(a.appliedAt)}</span>
                        <AppStatusBadge status={a.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <p className="muted profile-updated">Last updated {formatDate(c.updatedAt)}</p>
            </aside>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
