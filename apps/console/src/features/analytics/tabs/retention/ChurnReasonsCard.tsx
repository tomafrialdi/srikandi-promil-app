import { Badge, Card, CardHeader } from '../../../../shared/ui'
import { BarRow } from '../../../../shared/charts'
import { formatNumber, formatPercent, toPercentOf } from '../../../../shared/lib/format'
import { EXIT_REASON_LABEL } from '../../config/labels'
import type { RetentionData } from '../../types'

export function ChurnReasonsCard({ data }: { data: RetentionData['exit_reasons'] }) {
  const positive = data.rows.find((r) => r.reason === 'got_pregnant')
  return (
    <Card className="w-full flex-none min-[1101px]:w-105">
      <CardHeader
        title="Why users leave"
        subtitle={`Exit survey · n = ${formatNumber(data.total)} · last 12 months`}
        action={
          positive ? <Badge tone="success">{`${formatPercent(toPercentOf(positive.count, data.total), 0)} positive churn`}</Badge> : undefined
        }
      />
      <div className="flex flex-col gap-3.5">
        {data.rows.map((row) => {
          const meta = EXIT_REASON_LABEL[row.reason] ?? { label: row.reason, color: 'var(--ink-faint)' }
          const pct = toPercentOf(row.count, data.total)
          return (
            <BarRow
              key={row.reason}
              label={meta.label}
              labelWidth={150}
              value={pct}
              color={meta.color}
              barHeight={12}
              valueLabel={formatPercent(pct, 0)}
              valueWidth={36}
            />
          )
        })}
      </div>
    </Card>
  )
}
