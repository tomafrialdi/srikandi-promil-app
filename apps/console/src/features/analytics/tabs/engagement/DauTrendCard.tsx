import { Card, CardHeader } from '../../../../shared/ui'
import { Columns, Legend, type ColumnItem } from '../../../../shared/charts'
import type { EngagementData } from '../../types'

const dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

export function DauTrendCard({ data }: { data: EngagementData['dau_trend'] }) {
  const items: ColumnItem[] = data.map((point, index) => {
    const isLast = index === data.length - 1
    const showLabel = index % 5 === 0 || isLast
    const date = new Date(point.date)
    return {
      label: showLabel ? (isLast ? String(date.getUTCDate()) : dayMonth.format(date)) : '',
      value: point.dau,
      color: isLast ? 'var(--primary)' : 'rgba(37, 116, 196, 0.7)',
      active: isLast,
      tooltipTitle: dayMonth.format(date),
      tooltipValue: `${point.dau.toLocaleString('en-US')} active users`,
    }
  })

  return (
    <Card>
      <CardHeader
        title="Daily active users"
        subtitle="Last 30 days"
        action={
          <Legend
            items={[
              { label: 'DAU', color: 'var(--secondary)' },
              { label: 'Latest day', color: 'var(--primary)' },
            ]}
          />
        }
      />
      <Columns items={items} height={200} gap={6} radius={3} />
    </Card>
  )
}
