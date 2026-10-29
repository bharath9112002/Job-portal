/** Round profile photo, falling back to initials. */
export function Avatar({ src, name, size = 48 }) {
  const initials = (name.match(/[A-Za-z]+/g) ?? ['?'])
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
  const style = { width: size, height: size, fontSize: size * 0.38 }
  return src ? (
    <img className="avatar-img" src={src} alt={`${name}'s photo`} style={style} />
  ) : (
    <span className="avatar-img fallback" style={style} aria-hidden="true">
      {initials}
    </span>
  )
}
