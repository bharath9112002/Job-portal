import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchCandidate } from '../../candidates/api'
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
import { Avatar } from '../../components/Avatar'
import { FlashMessage } from '../../components/FlashMessage'
import { Icon } from '../../components/Icon'
import { useFlash } from '../../hooks/useFlash'

export default function CandidateProfile() {
  const { id } = useParams()
  const [candidate, setCandidate] = useState(null)
  const [error, setError] = useState(null)
  const [flash, setFlash] = useFlash()

  useEffect(() => {
    let cancelled = false
    fetchCandidate(Number(id))
      .then((c) => !cancelled && setCandidate(c))
      .catch((err) => !cancelled && setError(err))
    return () => {
      cancelled = true
    }
  }, [id])

  const c = candidate
  const role = c && latestRole(c.experience)
  const totalMonths = c ? totalExperienceMonths(c.experience) : 0
  const experience = c
    ? [...c.experience].sort((a, b) => (a.current === b.current ? b.startDate.localeCompare(a.startDate) : a.current ? -1 : 1))
    : []
  const education = c ? [...c.education].sort((a, b) => b.endYear.localeCompare(a.endYear)) : []

  return (
    <AdminLayout>
      <Link to="/candidates" className="back-link">
        <Icon name="arrow-left" size={16} /> Back to candidates
      </Link>

      {error && (
        <div className="panel state-panel" role="alert">
          <h2>{error.status === 404 ? 'Candidate not found' : "Couldn't load this profile"}</h2>
          <p className="muted">{error.message}</p>
          <Link to="/candidates" className="btn btn-primary">View all candidates</Link>
        </div>
      )}

      {!error && !c && (
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
            <Link to={`/candidates/${c.id}/edit`} className="btn btn-primary btn-icon profile-edit">
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

              <p className="muted profile-updated">Last updated {formatDate(c.updatedAt)}</p>
            </aside>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
