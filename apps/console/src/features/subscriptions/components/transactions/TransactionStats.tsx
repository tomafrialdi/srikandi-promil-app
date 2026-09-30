import { StatCard, StatGrid } from '../../../../shared/ui'
import { formatIdrCompact, formatNumber } from '../../../../shared/lib/format'
import type { TransactionsSummary } from '../../types'

export function TransactionStats({ data }: { data?: TransactionsSummary }) {
  const delta = data?.gross_delta_pct
  return (
    <StatGrid columns={4}>
      <StatCard
        label="Gross revenue"
        value={data ? formatIdrCompact(data.gross) : '—'}
        badge={delta != null ? { tone: delta >= 0 ? 'success' : 'warning', text: `${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta)}%` } : null}
      />
      <StatCard label="Net after fees" value={data ? formatIdrCompact(data.net) : '—'} badge={data ? { tone: 'neutral', text: `fees ${formatIdrCompact(data.fees)}` } : null} />
      <StatCard label="Refunds" value={data ? formatIdrCompact(data.refunds_amount) : '—'} badge={data ? { tone: 'warning', text: `${data.refunds_count} refunds` } : null} />
      <StatCard label="Failed payments" value={data ? formatNumber(data.failed) : '—'} badge={{ tone: 'neutral', text: 'auto-retry on' }} />
    </StatGrid>
  )
}
