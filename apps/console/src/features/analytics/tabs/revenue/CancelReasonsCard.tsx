import { Card, CardHeader } from '../../../../shared/ui'
import { BarRow } from '../../../../shared/charts'
import { formatPercent, toPercentOf } from '../../../../shared/lib/format'
import { CANCEL_REASON_LABEL } from '../../config/labels'
import type { RevenueData } from '../../types'

export function CancelReasonsCard({ data }: { data: RevenueData['churn_reasons'] }) {
  return (
    <Card className="w-full flex-none min-[1101px]:w-105">
      <CardHeader title="Revenue churn reasons" subtitle={`Cancellations · ${data.total} in the selected range`} />
      <div className="flex flex-col gap-3">
        {data.rows.map((row) => {
          const meta = CANCEL_REASON_LABEL[row.reason] ?? { label: row.reason, color: 'var(--ink-faint)' }
          const pct = toPercentOf(row.count, data.total)
          return (
            <BarRow
              key={row.reason}
              label={meta.label}
              labelWidth={130}
              value={pct}
              color={meta.color}
              barHeight={12}
              valueLabel={formatPercent(pct, 0)}
              valueWidth={36}
            />
          )
        })}
        {data.rows.length === 0 && <p className="text-12 text-ink-muted">No cancellations in this range.</p>}
      </div>
    </Card>
  )
}
