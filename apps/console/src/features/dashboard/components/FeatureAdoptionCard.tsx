import { Card, CardHeader, ProgressBar } from '../../../shared/ui'
import type { FeatureAdoption } from '../types'
import styles from './FeatureAdoptionCard.module.css'

export function FeatureAdoptionCard({ data }: { data: FeatureAdoption[] }) {
  return (
    <Card className={styles.card}>
      <CardHeader title="Feature adoption" subtitle="% of MAU using each feature" />
      {data.map((row) => (
        <div key={row.feature} className={styles.row}>
          <span className={styles.label}>{row.feature}</span>
          <ProgressBar value={row.pct} color="var(--secondary)" height={10} radius={3} />
          <span className={styles.value}>{row.pct}%</span>
        </div>
      ))}
      {data.length === 0 && <p className={styles.empty}>No feature usage in the last 30 days.</p>}
    </Card>
  )
}
