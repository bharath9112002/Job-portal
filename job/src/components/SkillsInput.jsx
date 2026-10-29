import { useId, useState } from 'react'

/** Tag-style input: type a skill and press Enter or comma; Backspace on empty removes the last one. */
export function SkillsInput({ label, name, value, onChange, suggestions, error, max = 12 }) {
  const [draft, setDraft] = useState('')
  const listId = useId()

  const add = (raw) => {
    const skill = raw.trim().replace(/,$/, '').trim()
    if (!skill || value.length >= max) return
    if (value.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...value, skill])
    setDraft('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(draft)
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  const available = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()))

  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <div className={error ? 'skills-input invalid' : 'skills-input'}>
        {value.map((skill) => (
          <span className="skill-tag" key={skill}>
            {skill}
            <button
              type="button"
              aria-label={`Remove ${skill}`}
              onClick={() => onChange(value.filter((s) => s !== skill))}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={name}
          name={name}
          list={listId}
          value={draft}
          placeholder={value.length ? '' : 'Type a skill and press Enter'}
          disabled={value.length >= max}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : `${name}-hint`}
          onChange={(e) => {
            const v = e.target.value
            // Picking from the datalist fills the whole value at once — add it straight away.
            if (available.includes(v)) add(v)
            else setDraft(v)
          }}
          onKeyDown={onKeyDown}
          onBlur={() => draft.trim() && add(draft)}
        />

        <datalist id={listId}>
          {available.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
      {error ? (
        <p className="field-error" id={`${name}-error`} role="alert">
          {error}
        </p>
      ) : (
        <p className="field-hint" id={`${name}-hint`}>
          {value.length}/{max} skills · press Enter or comma to add
        </p>
      )}
    </div>
  )
}
