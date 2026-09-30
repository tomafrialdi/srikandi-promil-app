import { Card, CardHeader } from '../../../../shared/ui'
import { BarRow } from '../../../../shared/charts'
import { formatIdrSigned } from '../../../../shared/lib/format'
import type { RevenueData } from '../../types'
import styles from './RevenueTab.module.css'

const COLOR: Record<string, string> = {
  plus_yearly: 'var(--primary)',
  plus_monthly: 'var(--pink)',
  b2b_clinic: 'var(--secondary)',
  teleconsult: 'var(--warning)',
  refund: 'var(--error)',
}

const monthLong = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' })

export function RevenueByPlanCard({ data }: { data: RevenueData['revenue_by_plan'] }) {
  const max = Math.max(1, ...data.rows.map((r) => Math.abs(r.amount)))
  return (
    <Card className={styles.side}>
      <CardHeader title="Revenue by plan" subtitle={`${monthLong.format(new Date(data.month))} · gross`} />
      <div className={styles.rows}>
        {data.rows.map((row) => (
          <BarRow
            key={row.key}
            label={row.label}
            labelWidth={150}
            value={(Math.abs(row.amount) / max) * 100}
            color={COLOR[row.key]}
            barHeight={12}
            valueLabel={row.amount < 0 ? formatIdrSigned(row.amount) : formatIdrSigned(row.amount).replace('+ ', '')}
            valueWidth={84}
          />
        ))}
      </div>
    </Card>
  )
}
