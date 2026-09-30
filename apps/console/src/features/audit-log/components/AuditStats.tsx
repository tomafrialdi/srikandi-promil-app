import { StatCard, StatGrid } from '../../../shared/ui'
import { formatNumber } from '../../../shared/lib/format'
import { timeOnly } from '../lib/format'
import type { AuditSummary } from '../types'

interface AuditStatsProps {
  data?: AuditSummary
  verifying: boolean
  onVerify: () => void
}

const AREA: Record<string, string> = { engine: 'engine', pricing: 'pricing', roles: 'roles', care: 'care' }

export function AuditStats({ data, verifying, onVerify }: AuditStatsProps) {
  const delta = data && data.events_prev > 0 ? Math.round(((data.events - data.events_prev) / data.events_prev) * 100) : null
  const chain = data?.chain
  return (
    <StatGrid>
      <StatCard label="Events (24h)" value={data ? formatNumber(data.events) : '—'} badge={delta != null ? { tone: 'neutral', text: `${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta)}%` } : null} />
      <StatCard label="Health-data access" value={data?.health_access ?? '—'} badge={data ? { tone: data.unmasked > 0 ? 'warning' : 'success', text: `${data.unmasked} unmasked` } : null} />
      <StatCard label="Failed logins" value={data?.failed_logins ?? '—'} badge={data ? { tone: data.flagged_ips > 0 ? 'error' : 'success', text: `${data.flagged_ips} flagged IP` } : null} />
      <StatCard label="Config changes" value={data?.config_changes ?? '—'} badge={data && data.config_areas.length > 0 ? { tone: 'neutral', text: data.config_areas.map((a) => AREA[a] ?? a).join(' · ') } : null} />
      <StatCard
        label="Chain integrity"
        value={!data ? '—' : !chain ? 'Not checked' : chain.ok ? 'Verified' : 'Broken'}
        badge={chain ? { tone: chain.ok ? 'success' : 'error', text: chain.ok ? `last check ${timeOnly(chain.at)}` : `broken at #${chain.broken_at}` } : null}
        hint={data?.can_act ? <button type="button" className="font-bold text-primary disabled:opacity-55" onClick={onVerify} disabled={verifying}>{verifying ? 'Checking…' : 'Verify now'}</button> : null}
      />
    </StatGrid>
  )
}
