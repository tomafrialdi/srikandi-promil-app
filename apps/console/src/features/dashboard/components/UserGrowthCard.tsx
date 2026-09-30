import { Card, CardHeader } from '../../../shared/ui'
import { Legend, StackedColumns, type StackedColumn } from '../../../shared/charts'
import type { GrowthPoint } from '../types'

const monthShort = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
const monthLong = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export function UserGrowthCard({ data }: { data: GrowthPoint[] }) {
  const columns: StackedColumn[] = data.map((point, index) => {
    const isLast = index === data.length - 1
    return {
      label: monthShort.format(new Date(point.month)),
      tooltipTitle: monthLong.format(new Date(point.month)),
      active: isLast,
      segments: [
        { value: point.free, color: isLast ? '#2574c4' : '#2574c4b3', name: 'Free' },
        { value: point.paid, color: '#c13d68', name: 'Paid' },
      ],
    }
  })

  return (
    <Card className="min-w-0 flex-1">
      <CardHeader
        title="User growth"
        subtitle="New sign-ups per month, free vs paid"
        action={
          <Legend
            items={[
              { label: 'Free', color: 'var(--secondary)' },
              { label: 'Paid', color: 'var(--primary)' },
            ]}
          />
        }
      />
      <StackedColumns columns={columns} height={240} gap={10} />
    </Card>
  )
}
