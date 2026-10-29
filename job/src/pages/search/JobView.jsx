import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { fetchCompany } from '../../companies/api'
import { fetchJob } from '../../jobs/api'
import { formatDate, formatSalary, isAcceptingApplications, postedAgo } from '../../jobs/types'
import { AdminLayout } from '../../components/AdminLayout'
import { CompanyLogo } from '../../components/CompanyLogo'
import { Icon } from '../../components/Icon'

/** Read-only job view for job seekers, reached from Job Search. */
export default function JobView() {
  const { id } = useParams()
  const location = useLocation()
  // Return to the same search, filters and page the user came from.
  const backTo = `/search${location.state?.from ?? ''}`

  const [job, setJob] = useState(null)
  const [error, setError] = useState(null)
  const [company, setCompany] = useState(null)
  const [companyFailed, setCompanyFailed] = useState(false)

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
          <Link to="/search" className="btn btn-primary">
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
    </AdminLayout>
  )
}
