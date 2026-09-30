import styles from './LineChart.module.css'

export interface LineSeries {
  name: string
  color: string
  /** One entry per x label; null leaves a gap. */
  values: Array<number | null>
  /** Draw thicker / emphasised. */
  emphasis?: boolean
}

interface LineChartProps {
  series: LineSeries[]
  xLabels: string[]
  height: number
  /** Y axis maximum, default 100. */
  max?: number
}

/** Percent line chart (0–max) with 5 gridlines; points are placed by the layout, not measured. */
export function LineChart({ series, xLabels, height, max = 100 }: LineChartProps) {
  const n = xLabels.length
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100)
  const y = (v: number) => 100 - (v / max) * 100
  const ticks = [4, 3, 2, 1, 0].map((k) => Math.round((max / 4) * k))

  return (
    <div className={styles.wrap} style={{ height }}>
      <div className={styles.yAxis}>
        {ticks.map((t) => (
          <span key={t}>{t}%</span>
        ))}
      </div>
      <div className={styles.plotWrap}>
        <div className={styles.plot}>
          {ticks.map((t) => (
            <span key={t} className={styles.grid} style={{ top: `${y(t)}%` }} />
          ))}
          <svg className={styles.svg} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {series.map((s) => {
              const points = s.values
                .map((v, i) => (v == null ? null : `${x(i)},${y(v)}`))
                .filter(Boolean)
                .join(' ')
              return (
                <polyline
                  key={s.name}
                  points={points}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.emphasis ? 2.5 : 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
          </svg>
          {series.map((s) =>
            s.values.map((v, i) =>
              v == null ? null : (
                <span
                  key={`${s.name}-${i}`}
                  className={styles.dot}
                  style={{ left: `${x(i)}%`, top: `${y(v)}%`, background: s.color }}
                  title={`${s.name} · ${xLabels[i]}: ${v}%`}
                />
              ),
            ),
          )}
        </div>
        <div className={styles.xAxis}>
          {xLabels.map((label, i) => (
            <span key={label} style={{ left: `${x(i)}%` }}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
