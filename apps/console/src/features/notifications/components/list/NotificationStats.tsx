import { StatCard, StatGrid } from '../../../../shared/ui'
import { formatCompact, formatPercent } from '../../../../shared/lib/format'
import type { NotificationsSummary } from '../../types'

export function NotificationStats({ data }: { data?: NotificationsSummary }) {
  const delivery = data?.delivery_rate
  const optout = data?.optout_rate
  return (
    <StatGrid columns={4}>
      <StatCard
        label="Sent (30d)"
        value={data ? (data.sent_30d >= 1_000_000 ? `${(data.sent_30d / 1_000_000).toFixed(2)}M` : formatCompact(data.sent_30d)) : '—'}
        badge={data ? { tone: 'neutral', text: `${data.campaigns_30d} campaigns` } : null}
      />
      <StatCard
        label="Delivery rate"
        value={formatPercent(delivery)}
        badge={delivery != null ? { tone: delivery >= 97 ? 'success' : 'warning', text: 'target ≥ 97%' } : null}
      />
      <StatCard label="Open rate" value={formatPercent(data?.open_rate)} badge={data?.open_rate != null ? { tone: 'neutral', text: 'of delivered' } : null} />
      <StatCard
        label="Opt-out rate"
        value={formatPercent(optout, 2)}
        badge={optout != null ? { tone: optout <= 0.5 ? 'success' : 'warning', text: 'target ≤ 0.5%' } : null}
      />
    </StatGrid>
  )
}
