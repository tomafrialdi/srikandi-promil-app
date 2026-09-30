import { Badge, Card, CardHeader } from '../../../../shared/ui'
import { formatNumber, formatPercent } from '../../../../shared/lib/format'
import { RETURN_SOURCE_LABEL } from '../../config/labels'
import { trendBadge } from '../../components/trend-badge'
import type { RetentionData } from '../../types'

export function WinBackCard({ data }: { data: RetentionData['win_back'] }) {
  const change =
    data.resurrected_prev > 0 ? ((data.resurrected - data.resurrected_prev) / data.resurrected_prev) * 100 : null
  const badge = trendBadge(change, { unit: '%', digits: 0 })

  return (
    <Card className="w-full flex-none min-[1101px]:w-95">
      <CardHeader title="Win-back" subtitle="Users returning after 30+ days inactive" />

      <Stat label="Resurrected this month">
        <span className="text-17 font-extrabold">{formatNumber(data.resurrected)}</span>
        {badge && <Badge tone={badge.tone}>{badge.text}</Badge>}
      </Stat>

      {data.top_source && (
        <Stat label="Top trigger">
          <span className="text-17 font-extrabold">{RETURN_SOURCE_LABEL[data.top_source.source] ?? data.top_source.source}</span>
          <span className="text-11 text-ink-muted">{formatPercent(data.top_source.share_pct, 0)} of returns</span>
        </Stat>
      )}

      <Stat label="Win-back campaign CTR">
        <span className="text-17 font-extrabold">{formatPercent(data.winback_ctr_pct)}</span>
        {data.best_campaign && <span className="text-11 text-ink-muted">“{data.best_campaign}”</span>}
      </Stat>
    </Card>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-surface px-3.5 py-3">
      <span className="text-11 font-semibold text-ink-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">{children}</div>
    </div>
  )
}
