import { Card, CardHeader } from '../../../../shared/ui'
import { Columns, type ColumnItem } from '../../../../shared/charts'
import { formatCompact } from '../../../../shared/lib/format'
import type { EngagementData } from '../../types'

export function StreaksCard({ data }: { data: EngagementData['streaks'] }) {
  const items: ColumnItem[] = data.map((bucket, index) => ({
    label: bucket.label,
    value: bucket.count,
    valueLabel: formatCompact(bucket.count),
    tooltipTitle: `${bucket.label} day streak`,
    tooltipValue: `${bucket.count.toLocaleString('en-US')} users`,
    color: index < 3 ? 'rgba(193, 61, 104, 0.4)' : 'var(--primary)',
  }))
  return (
    <Card className="min-w-0 flex-1">
      <CardHeader title="Logging streak distribution" subtitle="Active users by current streak length" />
      <Columns items={items} height={180} gap={6} radius={4} />
    </Card>
  )
}
