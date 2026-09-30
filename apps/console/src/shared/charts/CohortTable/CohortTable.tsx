import { formatNumber } from '../../lib/format'
import styles from './CohortTable.module.css'

interface CohortRow {
  label: string
  users: number
  /** % retained per week; null = not yet observable. */
  values: Array<number | null>
}

interface CohortTableProps {
  rows: CohortRow[]
  weekLabels: string[]
  /** Text used for the first column header. */
  cohortHeader?: string
}

function tone(value: number): { background: string; color: string } {
  if (value >= 60) return { background: '#c13d68', color: '#fff' }
  if (value >= 40) return { background: '#e07a9b', color: '#fff' }
  if (value >= 20) return { background: '#f6dee6', color: 'var(--ink)' }
  return { background: 'var(--surface-alt)', color: 'var(--ink-muted)' }
}

/** Retention heat table: rows are cohorts, columns are weeks since sign-up. */
export function CohortTable({ rows, weekLabels, cohortHeader = 'COHORT' }: CohortTableProps) {
  const cols = `96px 72px repeat(${weekLabels.length}, minmax(0, 1fr))`
  return (
    <div className={styles.table} role="table">
      <div className={`${styles.row} ${styles.head}`} style={{ gridTemplateColumns: cols }} role="row">
        <span>{cohortHeader}</span>
        <span>USERS</span>
        {weekLabels.map((label) => (
          <span key={label} className={styles.center}>
            {label}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row.label} className={styles.row} style={{ gridTemplateColumns: cols }} role="row">
          <span className={styles.cohort}>{row.label}</span>
          <span className={styles.users}>{formatNumber(row.users)}</span>
          {weekLabels.map((label, index) => {
            const value = row.values[index]
            return value == null ? (
              <span key={label} className={`${styles.cell} ${styles.empty}`}>
                —
              </span>
            ) : (
              <span key={label} className={styles.cell} style={tone(value)}>
                {value}%
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}
