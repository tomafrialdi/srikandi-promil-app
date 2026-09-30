import { cn } from '../../../shared/lib/cn'
import { Card, CardHeader } from '../../../shared/ui'
import { BarRow } from '../../../shared/charts'
import { formatNumber, formatPercent, toPercentOf } from '../../../shared/lib/format'
import type { Locations } from '../types'

const TONE = {
  primary: { box: 'bg-primary-soft', label: 'text-primary' },
  secondary: { box: 'bg-secondary-soft', label: 'text-secondary' },
  success: { box: 'bg-success-soft', label: 'text-success' },
}

export function LocationCard({ data }: { data: Locations }) {
  const rows = [
    ...data.provinces,
    ...(data.others.count > 0 ? [{ name: `Others (${data.others.provinces} prov.)`, count: data.others.count, muted: true }] : []),
  ]

  return (
    <Card className="min-w-0 flex-1">
      <CardHeader title="Users by location" subtitle="Top provinces · % of active users" />

      <div className="flex flex-col gap-6 min-[801px]:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          {rows.map((row, index) => {
            const pct = toPercentOf(row.count, data.total)
            const muted = 'muted' in row
            const color = muted ? 'var(--ink-faint)' : index < 3 ? 'var(--primary)' : 'rgba(193, 61, 104, 0.6)'
            return (
              <BarRow key={row.name} label={row.name} labelWidth={120} value={pct} color={color} barHeight={12} valueLabel={formatPercent(pct)} valueWidth={44} extra={formatNumber(row.count)} extraWidth={52} />
            )
          })}
        </div>

        <div className="flex w-full flex-none flex-col gap-2.5 min-[801px]:w-55">
          <SideStat tone="primary" label="Java island" value={formatPercent(data.java_share_pct)} hint="of all users" />
          {data.top_city && <SideStat tone="secondary" label="Top city" value={data.top_city.name} hint={`${formatNumber(data.top_city.count)} users`} />}
          {data.fastest_growing_city && (
            <SideStat tone="success" label="Fastest growing" value={data.fastest_growing_city.name} hint={`↑ ${data.fastest_growing_city.growth_pct}% last 30 days`} />
          )}
        </div>
      </div>
    </Card>
  )
}

function SideStat({ tone, label, value, hint }: { tone: keyof typeof TONE; label: string; value: string; hint: string }) {
  return (
    <div className={cn('flex flex-col gap-0.5 rounded-xl p-3', TONE[tone].box)}>
      <span className={cn('text-11 font-semibold', TONE[tone].label)}>{label}</span>
      <span className="text-15 font-extrabold text-ink">{value}</span>
      <span className="text-11 text-ink-muted">{hint}</span>
    </div>
  )
}
