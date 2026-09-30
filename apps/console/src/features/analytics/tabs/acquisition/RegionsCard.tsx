import { Card, CardHeader } from '../../../../shared/ui'
import { BarRow } from '../../../../shared/charts'
import type { AcquisitionData } from '../../types'
import styles from './AcquisitionTab.module.css'

export function RegionsCard({ data }: { data: AcquisitionData['regions'] }) {
  const fastest = [...data]
    .filter((r) => r.region !== 'Other' && (r.growth_pct ?? 0) > 0)
    .sort((a, b) => (b.growth_pct ?? 0) - (a.growth_pct ?? 0))[0]
  return (
    <Card className={styles.side}>
      <CardHeader title="New users by region" subtitle="Selected range" />
      <div className={styles.rows}>
        {data.map((row) => (
          <BarRow
            key={row.region}
            label={row.region}
            labelWidth={100}
            value={row.pct ?? 0}
            color={row.region === 'Other' ? 'var(--ink-faint)' : 'var(--secondary)'}
            barHeight={12}
            valueLabel={`${row.pct ?? 0}%${row.region === fastest?.region ? ' ↑' : ''}`}
            valueWidth={44}
          />
        ))}
      </div>
    </Card>
  )
}
