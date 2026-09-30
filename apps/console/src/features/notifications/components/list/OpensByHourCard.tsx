import { Badge, Card } from '../../../../shared/ui'
import { Columns, type ColumnItem } from '../../../../shared/charts'
import { isQuietHour } from '../../config/labels'
import type { HourlyOpens } from '../../types'

const AXIS = new Set([0, 6, 12, 18, 23])

export function OpensByHourCard({ data }: { data?: HourlyOpens }) {
  const items: ColumnItem[] = (data?.hours ?? Array.from({ length: 24 }, () => 0)).map((opens, hour) => ({
    label: AXIS.has(hour) ? String(hour).padStart(2, '0') : '',
    value: opens,
    color: isQuietHour(hour) ? 'var(--border)' : hour === data?.best_hour ? 'var(--primary)' : 'rgba(37, 116, 196, 0.7)',
    tooltipTitle: `${String(hour).padStart(2, '0')}:00`,
    tooltipValue: `${opens.toLocaleString('en-US')} opens`,
    seriesName: isQuietHour(hour) ? 'Quiet hours' : 'Opens',
  }))

  return (
    <Card className="gap-3.5 min-[1201px]:flex-1">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-15 font-bold">Opens by hour (local time)</h2>
          <p className="text-12 font-medium text-ink-muted">Last 7 days · push only</p>
        </div>
        {data && <Badge tone="primary">Best: {String(data.best_hour).padStart(2, '0')}:00</Badge>}
      </header>
      <Columns items={items} height={140} gap={4} radius={3} />
      <p className="text-12 font-medium text-ink-faint">Grey = quiet hours (21:00–07:00). Pushes are held until 07:00.</p>
    </Card>
  )
}
