import { useState } from 'react'

/** Company logo image, falling back to initials if the image is missing or fails to load. */
export function CompanyLogo({ src, name, size = 48 }: { src: string; name: string; size?: number }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const letters = (name.match(/[A-Za-z]+/g) ?? ['?'])
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  const style = { width: size, height: size, fontSize: size * 0.38 }

  if (!src || failedSrc === src) {
    return (
      <span className="company-logo fallback" style={style} aria-hidden="true">
        {letters}
      </span>
    )
  }
  return (
    <img
      className="company-logo"
      src={src}
      alt={`${name} logo`}
      style={style}
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  )
}
