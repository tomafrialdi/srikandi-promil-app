import { Card, CardHeader } from '../../../../shared/ui'
import { BarRow } from '../../../../shared/charts'
import { formatIdrSigned } from '../../../../shared/lib/format'
import type { RevenueData } from '../../types'

const COLOR: Record<string, string> = {
  plus_yearly: 'var(--primary)',
  plus_monthly: 'var(--pink)',
  b2b_clinic: 'var(--secondary)',
  teleconsult: 'var(--warning)',
  refund: 'var(--error)',
}

const monthLong = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' })

export function RevenueByPlanCard({ data }: { data: RevenueData['revenue_by_plan'] }) {
  const max = Math.max(1, ...data.rows.map((r) => Math.abs(r.amount)))
  return (
    <Card className="w-full flex-none min-[1101px]:w-105">
      <CardHeader title="Revenue by plan" subtitle={`${monthLong.format(new Date(data.month))} · gross`} />
      <div className="flex flex-col gap-3">
        {data.rows.map((row) => (
          <BarRow
            key={row.key}
            label={row.label}
            labelWidth={150}
            value={(Math.abs(row.amount) / max) * 100}
            color={COLOR[row.key]}
            barHeight={12}
            valueLabel={row.amount < 0 ? formatIdrSigned(row.amount) : formatIdrSigned(row.amount).replace('+ ', '')}
            valueWidth={84}
          />
        ))}
      </div>
    </Card>
  )
}
