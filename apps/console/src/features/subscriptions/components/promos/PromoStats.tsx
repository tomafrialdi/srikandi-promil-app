import { StatCard, StatGrid } from '../../../../shared/ui'
import { formatIdrCompact, formatNumber } from '../../../../shared/lib/format'
import type { PromosSummary } from '../../types'

export function PromoStats({ data }: { data?: PromosSummary }) {
  const delta = data?.redemptions_delta_pct
  return (
    <StatGrid>
      <StatCard label="Active codes" value={data ? formatNumber(data.counts.active) : '—'} badge={data ? { tone: 'neutral', text: `${data.counts.scheduled} scheduled` } : null} />
      <StatCard
        label="Redemptions (30d)"
        value={data ? formatNumber(data.redemptions_30d) : '—'}
        badge={delta != null ? { tone: delta >= 0 ? 'success' : 'warning', text: `${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta)}%` } : null}
      />
      <StatCard label="Discount given" value={data ? formatIdrCompact(data.discount_30d) : '—'} badge={{ tone: 'neutral', text: '30 days' }} />
      <StatCard
        label="Revenue from promo users"
        value={data ? formatIdrCompact(data.revenue_promo_users_30d) : '—'}
        badge={data?.roi != null ? { tone: 'success', text: `ROI ${data.roi}×` } : null}
      />
      <StatCard label="Flagged redemptions" value={data ? formatNumber(data.flagged) : '—'} badge={{ tone: 'error', text: 'same device / abuse' }} />
    </StatGrid>
  )
}
