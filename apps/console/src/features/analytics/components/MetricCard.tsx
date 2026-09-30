import type { ReactNode } from 'react'
import { Badge, Card } from '../../../shared/ui'
import { Sparkline } from '../../../shared/charts'
import type { TrendBadge } from './trend-badge'
import styles from './MetricCard.module.css'

interface MetricCardProps {
  label: string
  value: ReactNode
  badge?: TrendBadge | null
  spark?: number[]
}

export function MetricCard({ label, value, badge, spark }: MetricCardProps) {
  return (
    <Card className={styles.card}>
      <span className={styles.label}>{label}</span>
      <div className={styles.row}>
        <span className={styles.value}>{value}</span>
        {spark && spark.length > 1 && <Sparkline values={spark} />}
      </div>
      {badge && (
        <span>
          <Badge tone={badge.tone}>{badge.text}</Badge>
        </span>
      )}
    </Card>
  )
}

export function MetricStrip({ children }: { children: ReactNode }) {
  return <div className={styles.strip}>{children}</div>
}
