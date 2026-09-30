import { StatCard, StatGrid } from '../../../shared/ui'
import { durationText } from '../lib/format'
import type { SupportSummary } from '../types'

export function SupportStats({ data }: { data?: SupportSummary }) {
  const fr = data?.first_response_seconds
  const target = data ? durationText(data.first_response_target_seconds) : ''
  return (
    <StatGrid columns={4}>
      <StatCard label="Open" value={data?.open ?? '—'} badge={data ? { tone: data.unassigned > 0 ? 'warning' : 'success', text: `${data.unassigned} unassigned` } : null} />
      <StatCard label="Breaching SLA" value={data?.breaching ?? '—'} badge={data ? { tone: data.breaching > 0 ? 'error' : 'success', text: '> 24h' } : null} />
      <StatCard label="First response" value={fr != null ? durationText(fr) : '—'} badge={data ? { tone: fr != null && fr > data.first_response_target_seconds ? 'warning' : 'success', text: `target ${target}` } : null} />
      <StatCard label="CSAT" value={data?.csat_avg != null ? `${data.csat_avg} / 5` : '—'} badge={data ? { tone: 'success', text: `${data.csat_count} ratings` } : null} />
    </StatGrid>
  )
}
