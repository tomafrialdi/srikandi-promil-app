import { useState } from 'react'
import { Card, CardHeader, Segmented } from '../../../../shared/ui'
import { Columns, type ColumnItem } from '../../../../shared/charts'
import type { SubscriptionsOverview } from '../../types'
import styles from './overview.module.css'

type View = 'total' | 'monthly' | 'yearly'
const monthShort = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })

export function MrrChartCard({ data }: { data: SubscriptionsOverview['mrr_chart'] }) {
  const [view, setView] = useState<View>('total')

  const items: ColumnItem[] = data.map((point, index) => {
    const value = view === 'monthly' ? point.monthly : view === 'yearly' ? point.yearly : point.monthly + point.yearly
    const isLast = index === data.length - 1
    return {
      label: monthShort.format(new Date(point.month)),
      value,
      valueLabel: isLast ? String(Math.round(value / 1_000_000)) : undefined,
      color: isLast ? 'var(--primary)' : 'rgba(193, 61, 104, 0.35)',
      active: isLast,
      title: `${Math.round(value / 1_000_000)} juta`,
    }
  })

  return (
    <Card className={styles.grow}>
      <CardHeader
        title="MRR"
        subtitle="Rp juta · last 12 months"
        action={
          <Segmented
            label="MRR view"
            value={view}
            onChange={setView}
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
              { value: 'total', label: 'Total' },
            ]}
          />
        }
      />
      <Columns items={items} height={220} gap={10} radius={4} />
    </Card>
  )
}
