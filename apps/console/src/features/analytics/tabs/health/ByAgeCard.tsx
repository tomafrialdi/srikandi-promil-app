import { Card, CardHeader } from '../../../../shared/ui'
import { BarRow } from '../../../../shared/charts'
import type { HealthData } from '../../types'
import styles from './HealthTab.module.css'

/** Colour relative to the best age group, so the ranking stays readable at any absolute level. */
function tone(value: number, max: number): string {
  const ratio = max > 0 ? value / max : 0
  if (ratio >= 0.75) return 'var(--success)'
  if (ratio >= 0.4) return 'var(--warning)'
  return 'var(--error)'
}

export function ByAgeCard({ data }: { data: HealthData['by_age'] }) {
  const max = Math.max(1, ...data.map((r) => r.pct ?? 0))
  return (
    <Card className={styles.grow}>
      <CardHeader title="Conceived within 6 cycles, by age" subtitle="Share of users tracking ≥ 3 signals" />
      <div className={styles.rows}>
        {data.map((row) => (
          <BarRow
            key={row.label}
            label={row.label}
            labelWidth={56}
            value={((row.pct ?? 0) / max) * 100}
            color={tone(row.pct ?? 0, max)}
            barHeight={12}
            valueLabel={`${row.pct ?? 0}%`}
            valueWidth={40}
          />
        ))}
      </div>
      <p className={styles.note}>
        35+ users are routed to “see a specialist” after 6 months instead of 12 — per ASRM guidance.
      </p>
    </Card>
  )
}
