import { cn } from '../../lib/cn'
import { formatNumber } from '../../lib/format'

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
    <div className="flex flex-col gap-1 overflow-x-auto">
      <div className="grid min-w-140 items-center gap-1 text-11 font-bold text-ink-faint" style={{ gridTemplateColumns: cols }} role="row">
        <span>{cohortHeader}</span>
        <span>USERS</span>
        {weekLabels.map((label) => (
          <span key={label} className="text-center">
            {label}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row.label} className="grid min-w-140 items-center gap-1" style={{ gridTemplateColumns: cols }} role="row">
          <span className="text-13 font-semibold">{row.label}</span>
          <span className="text-13 text-ink-muted">{formatNumber(row.users)}</span>
          {weekLabels.map((label, index) => {
            const value = row.values[index]
            return value == null ? (
              <span key={label} className={cn('flex h-9 items-center justify-center rounded-md text-12 font-medium text-ink-faint')}>
                —
              </span>
            ) : (
              <span key={label} className="flex h-9 items-center justify-center rounded-md text-12 font-bold" style={tone(value)} title={`${row.label} · ${label}: ${value}% active`}>
                {value}%
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}
