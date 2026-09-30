import { Badge, Card, CardHeader } from '../../../shared/ui'
import { Columns, type ColumnItem } from '../../../shared/charts'
import { formatNumber, formatPercent, toPercentOf } from '../../../shared/lib/format'
import type { AgeDistribution } from '../types'

const BUCKET_COLOR: Record<string, string> = {
  '< 25': 'rgba(193, 61, 104, 0.5)',
  '25–29': 'rgba(193, 61, 104, 0.5)',
  '30–34': 'var(--primary)',
  '35–39': 'var(--warning)',
  '40+': 'var(--warning)',
}

export function AgeCard({ data }: { data: AgeDistribution }) {
  const buckets = data.buckets ?? []
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0)
  const older = buckets.filter((b) => b.label === '35–39' || b.label === '40+').reduce((sum, b) => sum + b.count, 0)

  const items: ColumnItem[] = buckets.map((bucket) => {
    const pct = toPercentOf(bucket.count, total)
    return {
      label: bucket.label,
      value: bucket.count,
      valueLabel: formatPercent(pct),
      color: BUCKET_COLOR[bucket.label] ?? 'var(--primary)',
      active: bucket.label === '30–34',
      tooltipTitle: `Age ${bucket.label}`,
      tooltipValue: `${formatNumber(bucket.count)} users`,
    }
  })

  return (
    <Card className="w-full flex-none min-[1101px]:w-105">
      <CardHeader
        title="Age distribution"
        subtitle={`Active users · median ${data.median_age ?? '—'} y.o.`}
        action={<Badge tone="warning">{`35+ · ${formatPercent(toPercentOf(older, total), 0)}`}</Badge>}
      />
      <Columns items={items} height={220} gap={12} radius={6} />
      <div className="flex flex-wrap gap-4">
        <span className="inline-flex items-center gap-1.5 text-11 font-semibold text-ink-muted">
          <span className="size-2.5 rounded-[3px] bg-primary" />
          Core (25–34)
        </span>
        <span className="inline-flex items-center gap-1.5 text-11 font-semibold text-ink-muted">
          <span className="size-2.5 rounded-[3px] bg-warning" />
          35+ · earlier specialist referral
        </span>
      </div>
    </Card>
  )
}
