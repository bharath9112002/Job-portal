import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isActive } from '../../applications/model'
import { fetchJobs } from '../../jobs/api'
import { formatDate, formatSalary, isAcceptingApplications } from '../../jobs/types'
import { AdminLayout } from '../../components/AdminLayout'
import { AppStatusBadge } from '../../components/AppStatusBadge'
import { Icon } from '../../components/Icon'
import { SaveJobButton } from '../../components/SaveJobButton'
import { useApplications } from '../../hooks/useApplications'
import { useAuth } from '../../hooks/useAuth'
import { useMyProfile } from '../../hooks/useMyProfile'
import { useSavedJobs } from '../../hooks/useSavedJobs'

/** Profile checklist used for the completeness meter. */
function profileChecks(p) {
  return [
    ['Contact details', !!(p.mobile && p.address.city)],
    ['At least 3 skills', p.skills.length >= 3],
    ['Education', p.education.length > 0],
    ['Work experience', p.experience.length > 0],
    ['Resume', !!p.resume],
    ['Profile photo', !!p.photo],
  ]
}

export default function CandidateHome() {
  const { user } = useAuth()
  const me = useMyProfile()
  const { applications, loadState: appsState } = useApplications()
  const { saved } = useSavedJobs()
  const [jobs, setJobs] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchJobs()
      .then((list) => !cancelled && setJobs(list))
      .catch(() => !cancelled && setJobs([]))
    return () => {
      cancelled = true
    }
  }, [])

  const profile = me.profile
  const mine = profile
    ? applications.filter((a) => a.candidateId === profile.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    : []
  const appliedJobIds = new Set(mine.filter((a) => a.status !== 'withdrawn').map((a) => a.jobId))

  // Recommended: open jobs not yet applied for, ranked by how many of the candidate's skills they need.
  const mySkills = new Set((profile?.skills ?? []).map((s) => s.toLowerCase()))
  const recommended = (jobs ?? [])
    .filter((j) => isAcceptingApplications(j) && !appliedJobIds.has(j.id))
    .map((j) => ({ job: j, matches: j.skills.filter((s) => mySkills.has(s.toLowerCase())).length }))
    .sort((a, b) => b.matches - a.matches || b.job.postedAt.localeCompare(a.job.postedAt))
    .slice(0, 4)

  const checks = profile ? profileChecks(profile) : []
  const done = checks.filter(([, ok]) => ok).length
  const completeness = profile ? Math.round((done / checks.length) * 100) : 0

  const tiles = [
    { label: 'Applications', value: mine.length, icon: 'file' },
    { label: 'In progress', value: mine.filter((a) => isActive(a.status)).length, icon: 'bolt' },
    { label: 'Interviews', value: mine.filter((a) => a.status === 'interview').length, icon: 'calendar' },
    { label: 'Saved jobs', value: saved.length, icon: 'bookmark' },
  ]

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <h1>Hi, {user.name.split(' ')[0]} 👋</h1>
          <p className="auth-subtitle">Here’s where your job search stands.</p>
        </div>
        <Link to="/candidate/jobs" className="btn btn-primary btn-icon">
          <Icon name="search" size={18} /> Find jobs
        </Link>
      </div>

      {me.loadState === 'ready' && !profile && (
        <div className="panel cta-panel">
          <div>
            <h2>Create your profile to start applying</h2>
            <p className="muted">Add your skills, experience and education — employers see this when you apply.</p>
          </div>
          <Link to="/candidate/profile/edit" className="btn btn-primary">Create profile</Link>
        </div>
      )}

      {me.loadState === 'error' && (
        <div className="alert alert-error" role="alert">Couldn’t load your profile: {me.error}</div>
      )}

      <section className="stats-grid home-stats" aria-label="Your numbers">
        {tiles.map((t) => (
          <article className="stat-card" key={t.label}>
            <div className="stat-top">
              <span className="stat-label">{t.label}</span>
              <span className="stat-icon"><Icon name={t.icon} /></span>
            </div>
            <span className="stat-value">{appsState === 'ready' || t.label === 'Saved jobs' ? t.value : '–'}</span>
          </article>
        ))}
      </section>

      <div className="profile-layout home-layout">
        <div className="profile-main">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Recommended for you</h3>
                <p className="muted">{mySkills.size ? 'Open jobs that match your skills' : 'Latest open jobs'}</p>
              </div>
              <Link to="/candidate/jobs" className="btn btn-outline btn-sm">See all</Link>
            </div>
            {!jobs ? (
              <div className="skeleton skeleton-line" style={{ height: 120 }} />
            ) : recommended.length === 0 ? (
              <p className="muted">No open jobs right now — check back soon.</p>
            ) : (
              <ul className="rec-list">
                {recommended.map(({ job, matches }) => (
                  <li key={job.id}>
                    <div className="rec-main">
                      <Link to={`/candidate/jobs/${job.id}`} className="top-title">{job.title}</Link>
                      <span className="muted">
                        {job.companyName} · {job.location} · {formatSalary(job.salaryMin, job.salaryMax)}
                      </span>
                      {mySkills.size > 0 && (
                        <span className={matches ? 'rec-match' : 'muted rec-nomatch'}>
                          {matches
                            ? `Matches ${matches} of your skills`
                            : 'No skill match yet'}
                        </span>
                      )}
                    </div>
                    <SaveJobButton jobId={job.id} jobTitle={job.title} compact />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>Recent applications</h3>
              <Link to="/candidate/applications" className="btn btn-outline btn-sm">View all</Link>
            </div>
            {mine.length === 0 ? (
              <p className="muted">You haven’t applied for any jobs yet.</p>
            ) : (
              <ul className="applied-list">
                {mine.slice(0, 4).map((a) => (
                  <li key={a.id}>
                    <Link to={`/candidate/applications/${a.id}`} className="applied-title">{a.jobTitle}</Link>
                    <span className="muted">{a.companyName} · applied {formatDate(a.appliedAt)}</span>
                    <AppStatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="profile-side">
          <section className="panel">
            <h2 className="details-section-title">Profile strength</h2>
            {!profile ? (
              <p className="muted">Create your profile to see how complete it is.</p>
            ) : (
              <>
                <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completeness} aria-label="Profile completeness">
                  <span style={{ width: `${completeness}%` }} />
                </div>
                <p className="meter-label"><strong>{completeness}%</strong> complete</p>
                <ul className="checklist">
                  {checks.map(([label, ok]) => (
                    <li key={label} className={ok ? 'done' : ''}>
                      <Icon name={ok ? 'check' : 'x'} size={14} /> {label}
                    </li>
                  ))}
                </ul>
                <Link to="/candidate/profile/edit" className="btn btn-outline btn-block">
                  {completeness === 100 ? 'Edit profile' : 'Complete profile'}
                </Link>
              </>
            )}
          </section>
        </aside>
      </div>
    </AdminLayout>
  )
}
