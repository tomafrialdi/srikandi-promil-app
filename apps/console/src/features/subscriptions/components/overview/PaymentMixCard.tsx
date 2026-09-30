import { Card, CardHeader } from '../../../../shared/ui'
import { BarRow } from '../../../../shared/charts'
import { CHANNEL_COLOR, CHANNEL_LABEL } from '../../config/labels'
import type { SubscriptionsOverview } from '../../types'
import styles from './overview.module.css'

export function PaymentMixCard({ data }: { data: SubscriptionsOverview['payment_mix'] }) {
  return (
    <Card className={styles.side}>
      <CardHeader title="Payment methods" subtitle="Share of transactions · last 30 days" />
      <div className={styles.mixRows}>
        {data.rows.map((row) => (
          <BarRow
            key={row.channel}
            label={CHANNEL_LABEL[row.channel]}
            labelWidth={90}
            value={row.pct ?? 0}
            color={CHANNEL_COLOR[row.channel]}
            barHeight={10}
            valueLabel={`${row.pct ?? 0}%`}
            valueWidth={36}
          />
        ))}
        {data.rows.length === 0 && <p className={styles.muted}>No transactions in the last 30 days.</p>}
      </div>
    </Card>
  )
}
