import { useSavedJobs } from '../hooks/useSavedJobs'
import { Icon } from './Icon'

/** Bookmark toggle for a job. `compact` shows just the icon (with an accessible label). */
export function SaveJobButton({ jobId, jobTitle, compact = false }) {
  const { isSaved, toggle } = useSavedJobs()
  const saved = isSaved(jobId)
  return (
    <button
      type="button"
      className={`btn btn-outline ${compact ? 'btn-sm save-btn icon-only' : 'btn-icon save-btn'}${saved ? ' saved' : ''}`}
      aria-pressed={saved}
      aria-label={compact ? `${saved ? 'Remove' : 'Save'} ${jobTitle}` : undefined}
      title={saved ? 'Remove from saved jobs' : 'Save job'}
      onClick={() => toggle(jobId)}
    >
      <Icon name="bookmark" size={16} filled={saved} />
      {!compact && (saved ? 'Saved' : 'Save job')}
    </button>
  )
}
