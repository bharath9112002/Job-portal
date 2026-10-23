import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  busy?: boolean
  error?: string
  onConfirm: () => void
  onCancel: () => void
}

/** Modal confirmation built on the native <dialog> (focus trapping and Esc for free). */
export function ConfirmDialog({ open, title, message, confirmLabel, busy, error, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onCancel()
      }}
    >
      <h2>{title}</h2>
      <p>{message}</p>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <div className="dialog-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Deleting…' : confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
