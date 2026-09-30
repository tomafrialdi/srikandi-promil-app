import { Card, CardHeader, ProgressBar } from '../../../shared/ui'
import { formatNumber, formatPercent, toPercentOf } from '../../../shared/lib/format'
import type { Funnel } from '../types'
import styles from './FunnelCard.module.css'

export function FunnelCard({ data }: { data: Funnel }) {
  return (
    <Card className={styles.card}>
      <CardHeader
        title="Activation funnel"
        subtitle={`Last 30 days cohort · ${formatNumber(data.cohort_size)} sign-ups`}
      />
      {data.steps.map((step) => {
        const pct = toPercentOf(step.count, data.cohort_size)
        return (
          <div key={step.key} className={styles.step}>
            <div className={styles.row}>
              <span className={styles.label}>{step.label}</span>
              <span className={styles.value}>{formatPercent(pct, pct < 10 ? 1 : 0)}</span>
            </div>
            <ProgressBar value={pct} />
          </div>
        )
      })}
    </Card>
  )
}
