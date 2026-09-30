import { Card, CardHeader } from '../../../../shared/ui'
import { Columns, type ColumnItem } from '../../../../shared/charts'
import type { HealthData } from '../../types'

export function TimeToPregnancyCard({ data }: { data: HealthData['time_to_pregnancy'] }) {
  const items: ColumnItem[] = data.rows.map((row) => ({
    label: row.cycle === 12 ? '12+' : String(row.cycle),
    value: row.pct ?? 0,
    color: row.cycle <= 6 ? 'var(--success)' : row.cycle === 12 ? 'var(--ink-faint)' : 'rgba(63, 153, 80, 0.5)',
    tooltipTitle: row.cycle === 12 ? 'Cycle 12+' : `Cycle ${row.cycle}`,
    tooltipValue: `${row.pct ?? 0}% of pregnancies`,
  }))
  return (
    <Card className="w-full flex-none min-[1101px]:w-110">
      <CardHeader title="Time to pregnancy" subtitle="Share of pregnancies by tracked cycle" />
      <Columns items={items} height={200} gap={8} radius={4} />
      <p className="text-12 text-ink-muted">
        {data.within_6_pct ?? 0}% of pregnancies happen within the first 6 tracked cycles.
      </p>
    </Card>
  )
}
