import styles from './HeatGrid.module.css'

interface HeatGridProps {
  rowLabels: string[]
  colLabels: string[]
  /** values[row][col]; rendered relative to the max value. */
  values: number[][]
  /** Cell colour at full intensity. */
  color?: string
}

export function HeatGrid({ rowLabels, colLabels, values, color = 'var(--primary)' }: HeatGridProps) {
  const max = Math.max(1, ...values.flat())
  return (
    <div className={styles.grid} style={{ gridTemplateColumns: `36px repeat(${colLabels.length}, minmax(0, 1fr))` }}>
      <span />
      {colLabels.map((label) => (
        <span key={label} className={styles.colLabel}>
          {label}
        </span>
      ))}
      {rowLabels.map((rowLabel, r) => (
        <div key={rowLabel} className={styles.rowFragment}>
          <span className={styles.rowLabel}>{rowLabel}</span>
          {colLabels.map((label, c) => {
            const value = values[r]?.[c] ?? 0
            return (
              <span
                key={label}
                className={styles.cell}
                title={`${rowLabel} ${label}:00 · ${value} sessions`}
                style={{ background: color, opacity: 0.08 + (value / max) * 0.92 }}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
