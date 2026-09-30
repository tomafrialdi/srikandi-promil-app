import { Card, CardHeader } from '../../../../shared/ui'
import { Legend, StackedColumns, type StackedColumn } from '../../../../shared/charts'
import { CHANNEL_COLOR, CHANNEL_ORDER, CHANNEL_SHORT_LABEL } from '../../config/labels'
import type { AcquisitionData } from '../../types'

/** ISO-8601 week number of a YYYY-MM-DD date. */
function isoWeek(isoDay: string): number {
  const d = new Date(`${isoDay}T00:00:00Z`)
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7)
}

export function WeeklyInstallsCard({ data }: { data: AcquisitionData['weekly_installs'] }) {
  const columns: StackedColumn[] = data.map((week, index) => ({
    label: `W${isoWeek(week.week_start)}`,
    active: index === data.length - 1,
    segments: CHANNEL_ORDER.map((channel) => ({
      value: week.counts[channel] ?? 0,
      color: CHANNEL_COLOR[channel],
      name: CHANNEL_SHORT_LABEL[channel],
    })),
  }))

  return (
    <Card>
      <CardHeader
        title="New installs by channel"
        subtitle="Weekly · last 12 weeks"
        action={<Legend items={CHANNEL_ORDER.map((c) => ({ label: CHANNEL_SHORT_LABEL[c], color: CHANNEL_COLOR[c] }))} />}
      />
      <StackedColumns columns={columns} height={220} gap={10} />
    </Card>
  )
}
