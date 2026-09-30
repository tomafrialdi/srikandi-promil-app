import { Card, CardHeader } from '../../../../shared/ui'
import { Legend, StackedColumns, type StackedColumn } from '../../../../shared/charts'
import type { OverviewData } from '../../types'

const COLORS = { lh: '#c13d68', bbt: '#2574c4', cervical: '#e07a9b', mood: '#e0a030' }

const LEGEND = [
  { label: 'LH test', color: COLORS.lh },
  { label: 'BBT', color: COLORS.bbt },
  { label: 'Cervical fluid', color: COLORS.cervical },
  { label: 'Mood / check-in', color: COLORS.mood },
]

export function DailyLogsCard({ data }: { data: OverviewData['daily_logs'] }) {
  const columns: StackedColumn[] = data.map((day, index) => ({
    label: String(Number(day.date.slice(8))),
    active: index === data.length - 1,
    segments: [
      { value: day.lh, color: COLORS.lh, name: 'LH test' },
      { value: day.bbt, color: COLORS.bbt, name: 'BBT' },
      { value: day.cervical, color: COLORS.cervical, name: 'Cervical fluid' },
      { value: day.mood, color: COLORS.mood, name: 'Mood' },
    ],
  }))

  return (
    <Card>
      <CardHeader title="Daily logs by signal" subtitle="Last 14 days" action={<Legend items={LEGEND} />} />
      <StackedColumns columns={columns} height={220} gap={8} />
    </Card>
  )
}
