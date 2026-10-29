import { useRef, useState } from 'react'
import { formatFileSize } from '../candidates/model'
import { Icon } from './Icon'

const EXTENSIONS = ['pdf', 'doc', 'docx']
const MAX_BYTES = 5 * 1024 * 1024

/**
 * Resume picker with drag & drop. UI only: the file is checked and its name/size recorded,
 * but the file itself isn't uploaded or stored anywhere.
 */
export function ResumeUpload({ value, onChange }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  const onFile = (file) => {
    setError('')
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!EXTENSIONS.includes(ext)) {
      setError('Upload a PDF or Word document (.pdf, .doc, .docx).')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Resume must be 5 MB or smaller.')
      return
    }
    if (file.size === 0) {
      setError('That file is empty.')
      return
    }
    onChange({ name: file.name, size: file.size, addedAt: new Date().toISOString() })
  }

  return (
    <div className="field">
      <span className="field-label">Resume</span>
      {value ? (
        <div className="resume-card">
          <span className="resume-icon"><Icon name="file" size={22} /></span>
          <div className="resume-info">
            <span className="resume-name">{value.name}</span>
            <span className="muted">{formatFileSize(value.size)}</span>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => inputRef.current?.click()}>
            Replace
          </button>
          <button type="button" className="btn btn-outline btn-sm btn-danger-outline" onClick={() => onChange(null)}>
            Remove
          </button>
        </div>
      ) : (
        <div
          className={dragging ? 'drop-zone dragging' : 'drop-zone'}
          role="button"
          tabIndex={0}
          aria-describedby="resume-hint"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            onFile(e.dataTransfer.files?.[0])
          }}
        >
          <Icon name="file" size={28} />
          <span>
            <strong>Click to upload</strong> or drag and drop
          </span>
          <span className="muted">PDF, DOC or DOCX · up to 5 MB</span>
        </div>
      )}
      <input
        ref={inputRef}
        id="resume"
        type="file"
        accept=".pdf,.doc,.docx"
        hidden
        onChange={(e) => {
          onFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {error ? (
        <p className="field-error" role="alert">{error}</p>
      ) : (
        <p className="field-hint" id="resume-hint">Optional. Demo only — the file isn't actually uploaded.</p>
      )}
    </div>
  )
}
