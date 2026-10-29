import { Icon } from './Icon'

export function FlashMessage({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="alert alert-success alert-dismissible" role="status">
      <span>{message}</span>
      <button type="button" aria-label="Dismiss" onClick={onDismiss}>
        <Icon name="x" size={16} />
      </button>
    </div>
  )
}
