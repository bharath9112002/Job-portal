const fmt = (n) => n.toLocaleString('en-IN')

/** Rounds the max up to a tidy axis ceiling (e.g. 2930 → 3000). */
function niceMax(max) {
  const step = 10 ** Math.floor(Math.log10(max))
  return Math.ceil(max / (step / 2)) * (step / 2)
}

/** Single-series vertical bars with a recessive grid and a tooltip per bar. */
export function ColumnChart({ title, data, unit }) {
  const max = niceMax(Math.max(...data.map((d) => d.value)))
  const ticks = [max, max * 0.75, max * 0.5, max * 0.25, 0]

  return (
    <figure className="chart">
      <div
        className="column-chart"
        role="img"
        aria-label={`${title}: ${data.map((d) => `${d.label} ${fmt(d.value)}`).join(', ')}`}
      >
        <div className="y-axis" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t}>{t >= 1000 ? `${t / 1000}k` : t}</span>
          ))}
        </div>
        <div className="plot">
          <div className="gridlines" aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} />
            ))}
          </div>
          <div className="columns">
            {data.map((d, i) => (
              <div className="column" key={d.label} tabIndex={0} aria-label={`${d.label}: ${fmt(d.value)} ${unit}`}>
                <div className="bar" style={{ height: `${(d.value / max) * 100}%` }}>
                  <div className="tooltip" role="tooltip">
                    <strong>{fmt(d.value)}</strong> {unit}
                    <span>{d.label}</span>
                  </div>
                </div>
                <span className={i % 2 ? 'x-label odd' : 'x-label'}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </figure>
  )
}

/** Single-series horizontal bars, direct-labelled with their values. */
export function BarList({ title, data, unit }) {
  const max = Math.max(...data.map((d) => d.value))
  return (
    <figure className="chart">
      <ul className="bar-list" aria-label={title}>
        {data.map((d) => (
          <li key={d.label} tabIndex={0} aria-label={`${d.label}: ${fmt(d.value)} ${unit}`}>
            <div className="bar-list-head">
              <span>{d.label}</span>
              <span className="bar-list-value">{fmt(d.value)}</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(d.value / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </figure>
  )
}
