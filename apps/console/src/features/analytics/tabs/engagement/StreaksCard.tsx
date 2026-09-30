import { Card, CardHeader } from '../../../../shared/ui'
import { Columns, type ColumnItem } from '../../../../shared/charts'
import { formatCompact } from '../../../../shared/lib/format'
import type { EngagementData } from '../../types'
import styles from './EngagementTab.module.css'

export function StreaksCard({ data }: { data: EngagementData['streaks'] }) {
  const items: ColumnItem[] = data.map((bucket, index) => ({
    label: bucket.label,
    value: bucket.count,
    valueLabel: formatCompact(bucket.count),
    color: `rgba(193, 61, 104, ${0.25 + (index / Math.max(1, data.length - 1)) * 0.75})`,
  }))
  return (
    <Card className={styles.grow}>
      <CardHeader title="Logging streak distribution" subtitle="Active users by current streak length (days)" />
      <Columns items={items} height={180} gap={6} radius={4} />
    </Card>
  )
}
