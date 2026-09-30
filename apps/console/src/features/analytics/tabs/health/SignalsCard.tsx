import { Card, CardHeader } from '../../../../shared/ui'
import { BarRow } from '../../../../shared/charts'
import { DEPTH_LABEL } from '../../config/labels'
import type { HealthData } from '../../types'

export function SignalsCard({ data }: { data: HealthData['signals'] }) {
  const max = Math.max(1, ...data.rows.map((r) => r.median_cycles))
  return (
    <Card className="min-w-0 flex-1">
      <CardHeader title="Signals vs. time to pregnancy" subtitle="Median tracked cycles" />
      <div className="flex flex-col gap-3">
        {data.rows.map((row, index) => (
          <BarRow
            key={row.depth}
            label={DEPTH_LABEL[row.depth]}
            labelWidth={150}
            value={(row.median_cycles / max) * 100}
            color={
              row.depth === 'calendar_only' ? 'var(--ink-faint)' : index === 0 ? 'var(--success)' : 'rgba(63, 153, 80, 0.6)'
            }
            barHeight={10}
            valueLabel={row.median_cycles}
            valueWidth={28}
          />
        ))}
      </div>
    </Card>
  )
}
