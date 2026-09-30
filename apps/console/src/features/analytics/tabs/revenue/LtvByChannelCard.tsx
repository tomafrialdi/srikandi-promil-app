import { Card, CardHeader } from '../../../../shared/ui'
import { BarRow } from '../../../../shared/charts'
import { formatIdrCompact } from '../../../../shared/lib/format'
import { CHANNEL_SHORT_LABEL } from '../../config/labels'
import type { RevenueData } from '../../types'
import styles from './RevenueTab.module.css'

export function LtvByChannelCard({ data }: { data: RevenueData['ltv_by_channel'] }) {
  const max = Math.max(1, ...data.map((r) => r.ltv))
  return (
    <Card className={styles.side}>
      <CardHeader title="LTV by acquisition channel" subtitle="Paid users · 12-month LTV" />
      <div className={styles.rows}>
        {data.map((row, index) => (
          <BarRow
            key={row.channel}
            label={CHANNEL_SHORT_LABEL[row.channel]}
            labelWidth={110}
            value={(row.ltv / max) * 100}
            color={index === 0 ? 'var(--success)' : 'rgba(63, 153, 80, 0.6)'}
            barHeight={12}
            valueLabel={formatIdrCompact(row.ltv)}
            valueWidth={70}
          />
        ))}
        {data.length === 0 && <p className={styles.empty}>No paying users yet.</p>}
      </div>
    </Card>
  )
}
