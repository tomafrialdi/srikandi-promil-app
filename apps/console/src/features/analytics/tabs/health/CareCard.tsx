import { Card, CardHeader } from '../../../../shared/ui'
import { formatNumber } from '../../../../shared/lib/format'
import { trendBadge } from '../../components/trend-badge'
import type { HealthData } from '../../types'
import styles from './HealthTab.module.css'

export function CareCard({ data }: { data: HealthData['care'] }) {
  const change = trendBadge(data.counsellor_sessions_delta_pct, { unit: '%', digits: 0 })
  return (
    <Card className={styles.care}>
      <CardHeader title="Care & safety" subtitle="Sensitive · aggregated only" />
      <Stat label="Pregnancy losses reported" value={formatNumber(data.pregnancy_losses)} hint="after-loss mode offered to everyone" />
      <Stat
        label="Counsellor sessions booked"
        value={formatNumber(data.counsellor_sessions)}
        hint={change ? `${change.text} vs previous period` : 'in selected range'}
      />
      <Stat label="Wellbeing protocol triggers" value={formatNumber(data.wellbeing_triggers)} hint="in selected range" />
    </Card>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statHint}>{hint}</span>
    </div>
  )
}
