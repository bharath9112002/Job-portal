import { useRef, useState } from 'react'
import { Avatar } from './Avatar'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 2 * 1024 * 1024
const OUTPUT_SIZE = 256

/** Centre-crops and scales an image to a small square JPEG data URL, so it fits in localStorage. */
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const side = Math.min(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      canvas
        .getContext('2d')
        .drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That image could not be read. Try a different file.'))
    }
    img.src = url
  })
}

export function PhotoUpload({ value, name, onChange }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onFile = async (file) => {
    setError('')
    if (!file) return
    if (!ACCEPTED.includes(file.type)) {
      setError('Use a JPG, PNG or WebP image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Image must be 2 MB or smaller.')
      return
    }
    setBusy(true)
    try {
      onChange(await resizeImage(file))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="photo-upload">
      <Avatar src={value} name={name || '?'} size={88} />
      <div>
        <p className="photo-label">Profile photo</p>
        <div className="photo-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? 'Processing…' : value ? 'Change photo' : 'Upload photo'}
          </button>
          {value && (
            <button type="button" className="btn btn-outline btn-sm btn-danger-outline" onClick={() => onChange('')}>
              Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          id="photo"
          type="file"
          accept={ACCEPTED.join(',')}
          hidden
          onChange={(e) => {
            onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        {error ? (
          <p className="field-error" role="alert">{error}</p>
        ) : (
          <p className="field-hint">JPG, PNG or WebP, up to 2 MB. Optional.</p>
        )}
      </div>
    </div>
  )
}
