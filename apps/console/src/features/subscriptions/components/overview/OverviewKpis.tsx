import { StatCard, StatGrid } from '../../../../shared/ui'
import { formatIdrCompact, formatNumber, formatPercent } from '../../../../shared/lib/format'
import type { SubscriptionsOverview } from '../../types'

const arrow = (value: number, digits = 1, unit = '') => `${value >= 0 ? '↑' : '↓'} ${Number(Math.abs(value).toFixed(digits))}${unit}`

export function OverviewKpis({ data }: { data: SubscriptionsOverview['kpis'] }) {
  const arppuDelta = data.arppu != null && data.arppu_prev ? ((data.arppu - data.arppu_prev) / data.arppu_prev) * 100 : null
  return (
    <StatGrid>
      <StatCard
        label="MRR"
        value={formatIdrCompact(data.mrr)}
        badge={data.mrr_delta_pct != null ? { tone: data.mrr_delta_pct >= 0 ? 'success' : 'warning', text: arrow(data.mrr_delta_pct, 1, '%') } : null}
      />
      <StatCard label="ARR" value={formatIdrCompact(data.arr)} badge={{ tone: 'neutral', text: 'run-rate' }} />
      <StatCard
        label="Paying subscribers"
        value={formatNumber(data.paying)}
        badge={{ tone: data.paying_delta >= 0 ? 'success' : 'warning', text: arrow(data.paying_delta, 0) }}
      />
      <StatCard
        label="Monthly churn"
        value={formatPercent(data.churn_pct)}
        badge={data.churn_delta != null ? { tone: data.churn_delta <= 0 ? 'success' : 'warning', text: `${arrow(data.churn_delta, 1)} pts` } : null}
      />
      <StatCard
        label="ARPPU"
        value={data.arppu != null ? formatIdrCompact(data.arppu) : '—'}
        badge={arppuDelta == null || Math.abs(arppuDelta) < 1 ? { tone: 'neutral', text: 'flat' } : { tone: arppuDelta >= 0 ? 'success' : 'warning', text: arrow(arppuDelta, 1, '%') }}
      />
    </StatGrid>
  )
}
