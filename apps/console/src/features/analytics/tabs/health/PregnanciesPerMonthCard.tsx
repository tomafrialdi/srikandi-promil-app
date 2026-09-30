import { Card, CardHeader } from '../../../../shared/ui'
import { Columns, type ColumnItem } from '../../../../shared/charts'
import type { HealthData } from '../../types'

const monthShort = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
const monthLong = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export function PregnanciesPerMonthCard({ data }: { data: HealthData['pregnancies_per_month'] }) {
  const items: ColumnItem[] = data.map((point, index) => {
    const isLast = index === data.length - 1
    return {
      label: monthShort.format(new Date(point.month)),
      value: point.count,
      valueLabel: String(point.count),
      color: isLast ? 'var(--success)' : 'rgba(63, 153, 80, 0.5)',
      active: isLast,
      tooltipTitle: monthLong.format(new Date(point.month)),
      tooltipValue: `${point.count} pregnancies`,
    }
  })
  return (
    <Card className="min-w-0 flex-1">
      <CardHeader title="Pregnancies reported per month" subtitle="Positive tests confirmed in pregnancy mode" />
      <Columns items={items} height={220} gap={8} radius={4} />
    </Card>
  )
}
