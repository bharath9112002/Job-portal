import { STATUSES } from '../applications/model'

/** Application status pill — always shows the label, so colour is never the only signal. */
export function AppStatusBadge({ status }) {
  const { label, tone } = STATUSES[status] ?? { label: status, tone: 'muted' }
  return <span className={`app-status ${tone}`}>{label}</span>
}
