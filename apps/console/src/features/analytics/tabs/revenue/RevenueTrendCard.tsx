import { Card, CardHeader } from '../../../../shared/ui'
import { Legend, StackedColumns, type StackedColumn } from '../../../../shared/charts'
import type { RevenueData } from '../../types'
import styles from './RevenueTab.module.css'

const COLORS = { subscriptions: '#c13d68', b2b: '#2574c4', teleconsult: '#e0a030' }
const monthShort = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })

export function RevenueTrendCard({ data }: { data: RevenueData['revenue_trend'] }) {
  const columns: StackedColumn[] = data.map((point, index) => ({
    label: monthShort.format(new Date(point.month)),
    active: index === data.length - 1,
    segments: [
      { value: point.subscriptions, color: COLORS.subscriptions, name: 'Subscriptions' },
      { value: point.b2b_clinic, color: COLORS.b2b, name: 'B2B clinics' },
      { value: point.teleconsult, color: COLORS.teleconsult, name: 'Teleconsult' },
    ],
  }))
  return (
    <Card className={styles.grow}>
      <CardHeader
        title="Monthly revenue by source"
        subtitle="Rp juta · last 12 months"
        action={
          <Legend
            items={[
              { label: 'Subscriptions', color: COLORS.subscriptions },
              { label: 'B2B clinics', color: COLORS.b2b },
              { label: 'Teleconsult', color: COLORS.teleconsult },
            ]}
          />
        }
      />
      <StackedColumns
        columns={columns}
        height={200}
        gap={10}
        formatTick={(value) => String(Math.round(value / 1_000_000))}
      />
    </Card>
  )
}
