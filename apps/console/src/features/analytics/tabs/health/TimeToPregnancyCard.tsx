import { Card, CardHeader } from '../../../../shared/ui'
import { Columns, type ColumnItem } from '../../../../shared/charts'
import type { HealthData } from '../../types'
import styles from './HealthTab.module.css'

export function TimeToPregnancyCard({ data }: { data: HealthData['time_to_pregnancy'] }) {
  const items: ColumnItem[] = data.rows.map((row) => ({
    label: row.cycle === 12 ? '12+' : String(row.cycle),
    value: row.pct ?? 0,
    color: row.cycle <= 6 ? 'var(--success)' : row.cycle === 12 ? 'var(--ink-faint)' : 'rgba(63, 153, 80, 0.5)',
    title: `${row.pct ?? 0}% of pregnancies`,
  }))
  return (
    <Card className={styles.timeToPregnancy}>
      <CardHeader title="Time to pregnancy" subtitle="Share of pregnancies by tracked cycle" />
      <Columns items={items} height={200} gap={8} radius={4} />
      <p className={styles.note}>
        {data.within_6_pct ?? 0}% of pregnancies happen within the first 6 tracked cycles.
      </p>
    </Card>
  )
}
