import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { fetchCompany } from '../../companies/api'
import { fetchJob } from '../../jobs/api'
import { formatDate, formatSalary, isAcceptingApplications, postedAgo } from '../../jobs/types'
import { AdminLayout } from '../../components/AdminLayout'
import { AppStatusBadge } from '../../components/AppStatusBadge'
import { ApplyDialog } from '../../components/ApplyDialog'
import { CompanyLogo } from '../../components/CompanyLogo'
import { Icon } from '../../components/Icon'
import { SaveJobButton } from '../../components/SaveJobButton'
import { useApplications } from '../../hooks/useApplications'
import { useMyProfile } from '../../hooks/useMyProfile'
import { usePortal } from '../../hooks/usePortal'

/**
 * Read-only job view, reached from Job Search. Admins apply on behalf of a candidate;
 * candidates apply as themselves (they need a profile first).
 */
export default function JobView() {
  const { id } = useParams()
  const location = useLocation()
  // Return to the same search, filters and page the user came from.
  const { isCandidate, jobsPath } = usePortal()
  const backTo = `${jobsPath}${location.state?.from ?? ''}`
  const me = useMyProfile()

  const [job, setJob] = useState(null)
  const [error, setError] = useState(null)
  const [company, setCompany] = useState(null)
  const [companyFailed, setCompanyFailed] = useState(false)
  const [applyOpen, setApplyOpen] = useState(false)
  const [flash, setFlash] = useState(null)
  const { applications } = useApplications()
  const jobApplications = applications.filter((a) => a.jobId === Number(id) && a.status !== 'withdrawn')
  const myApplication = me.profile && jobApplications.find((a) => a.candidateId === me.profile.id)
  const applicationPath = (appId) => (isCandidate ? `/candidate/applications/${appId}` : `/applications/${appId}`)

  useEffect(() => {
    let cancelled = false
    fetchJob(Number(id))
      .then((j) => {
        if (cancelled) return
        setJob(j)
        // Company info is a bonus: if the API call fails, the job is still shown.
        fetchCompany(j.companyId)
          .then((c) => !cancelled && setCompany(c))
          .catch(() => !cancelled && setCompanyFailed(true))
      })
      .catch((err) => !cancelled && setError(err))
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <AdminLayout>
      <Link to={backTo} className="back-link">
        <Icon name="arrow-left" size={16} /> Back to search results
      </Link>

      {error && (
        <div className="panel state-panel" role="alert">
          <h2>{error.status === 404 ? 'Job not found' : "Couldn't load this job"}</h2>
          <p className="muted">{error.message}</p>
          <Link to={jobsPath} className="btn btn-primary">
            Search jobs
          </Link>
        </div>
      )}

      {!error && !job && (
        <div className="panel" aria-busy="true" aria-label="Loading job">
          <div className="skeleton skeleton-line" style={{ width: '45%', height: 26 }} />
          <div className="skeleton skeleton-line" style={{ width: '25%' }} />
          <div className="skeleton skeleton-line" style={{ width: '80%' }} />
        </div>
      )}

      {flash && (
        <div className="alert alert-success alert-dismissible" role="status">
          <span>
            {isCandidate ? 'Your application was submitted.' : `Application submitted for ${flash.candidateName}.`}{' '}
            <Link to={applicationPath(flash.id)}>View application</Link>
          </span>
          <button type="button" aria-label="Dismiss" onClick={() => setFlash(null)}>
            <Icon name="x" size={16} />
          </button>
        </div>
      )}

      {job && (
        <div className="view-layout">
          <div className="panel">
            {!isAcceptingApplications(job) && (
              <div className="alert alert-error" role="status">
                This job is no longer accepting applications.
              </div>
            )}
            <div className="view-head">
              <CompanyLogo src={company?.logo ?? ''} name={job.companyName} size={64} />
              <div>
                <h1>{job.title}</h1>
                <p className="result-company">
                  {job.companyName} · {job.location}
                </p>
                <p className="muted view-posted">Posted {postedAgo(job.postedAt).toLowerCase()}</p>
              </div>
            </div>

            <div className="view-actions">
              {isAcceptingApplications(job) &&
                (!isCandidate ? (
                  <button type="button" className="btn btn-primary btn-icon" onClick={() => setApplyOpen(true)}>
                    <Icon name="file" size={16} /> Apply for this job
                  </button>
                ) : myApplication ? (
                  <span className="applied-note">
                    <Icon name="check" size={16} /> You applied · <AppStatusBadge status={myApplication.status} />{' '}
                    <Link to={applicationPath(myApplication.id)}>View application</Link>
                  </span>
                ) : me.loadState === 'ready' && !me.profile ? (
                  <Link to="/candidate/profile/edit" className="btn btn-primary btn-icon">
                    <Icon name="users" size={16} /> Create your profile to apply
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-icon"
                    disabled={!me.profile}
                    onClick={() => setApplyOpen(true)}
                  >
                    <Icon name="file" size={16} /> Apply now
                  </button>
                ))}
              <SaveJobButton jobId={job.id} jobTitle={job.title} />
              {!isCandidate && jobApplications.length > 0 && (
                <Link to={`/applications?job=${job.id}`} className="view-app-count">
                  {jobApplications.length} {jobApplications.length === 1 ? 'application' : 'applications'}
                </Link>
              )}
            </div>

            <div className="view-highlights">
              <div>
                <span className="muted">Salary</span>
                <strong>{formatSalary(job.salaryMin, job.salaryMax)} / yr</strong>
              </div>
              <div>
                <span className="muted">Job type</span>
                <strong>{job.employmentType}</strong>
              </div>
              <div>
                <span className="muted">Experience</span>
                <strong>{job.experienceLevel}</strong>
              </div>
              <div>
                <span className="muted">Apply by</span>
                <strong>{formatDate(job.deadline)}</strong>
              </div>
            </div>

            <h2 className="details-section-title">Required skills</h2>
            <div className="job-skills">
              {job.skills.map((s) => (
                <span className="skill-tag static" key={s}>
                  {s}
                </span>
              ))}
            </div>

            <h2 className="details-section-title view-section">Category</h2>
            <span className="chip">{job.category}</span>
          </div>

          <aside className="panel company-aside">
            <h2 className="details-section-title">About the company</h2>
            {company ? (
              <>
                <div className="aside-company">
                  <CompanyLogo src={company.logo} name={company.name} size={44} />
                  <div>
                    <strong>{company.name}</strong>
                    <span className="muted">{company.industry}</span>
                  </div>
                </div>
                <ul className="company-meta">
                  <li>
                    <Icon name="pin" size={16} />
                    {company.location}
                  </li>
                  <li>
                    <Icon name="users" size={16} />
                    {company.employees.toLocaleString('en-IN')} employees
                  </li>
                  <li>
                    <Icon name="globe" size={16} />
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="truncate">
                      {company.website.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  </li>
                </ul>
                <p className="aside-description">{company.description}</p>
              </>
            ) : companyFailed ? (
              <p className="muted">Company details are unavailable right now.</p>
            ) : (
              <>
                <div className="skeleton skeleton-line" style={{ width: '70%' }} />
                <div className="skeleton skeleton-line" style={{ width: '50%' }} />
                <div className="skeleton skeleton-line" style={{ width: '90%' }} />
              </>
            )}
          </aside>
        </div>
      )}
      {job && (
        <ApplyDialog
          open={applyOpen}
          job={job}
          candidate={isCandidate ? me.profile : undefined}
          onClose={() => setApplyOpen(false)}
          onApplied={(created) => {
            setApplyOpen(false)
            setFlash(created)
          }}
        />
      )}
    </AdminLayout>
  )
}
