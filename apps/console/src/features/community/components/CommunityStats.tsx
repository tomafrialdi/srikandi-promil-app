import { StatCard, StatGrid } from '../../../shared/ui'
import { formatNumber } from '../../../shared/lib/format'
import type { CommunitySummary } from '../types'

export function CommunityStats({ data }: { data?: CommunitySummary }) {
  const delta = data?.posts_delta_pct
  return (
    <StatGrid columns={4}>
      <StatCard
        label="Posts today"
        value={data ? formatNumber(data.posts_today) : '—'}
        badge={delta != null ? { tone: delta >= 0 ? 'success' : 'warning', text: `${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta)}%` } : null}
      />
      <StatCard
        label="Open reports"
        value={data?.open_reports ?? '—'}
        badge={data ? { tone: data.urgent > 0 ? 'error' : 'neutral', text: `${data.urgent} urgent` } : null}
      />
      <StatCard
        label="Auto-hidden by AI"
        value={data?.ai_flagged ?? '—'}
        badge={data?.ai_precision_pct != null ? { tone: 'success', text: `${data.ai_precision_pct}% precision` } : null}
      />
      <StatCard
        label="Median review time"
        value={data?.median_review_min != null ? `${data.median_review_min} min` : '—'}
        badge={data?.median_review_min != null ? { tone: data.median_review_min <= 60 ? 'success' : 'warning', text: 'SLA 60 min' } : null}
      />
    </StatGrid>
  )
}
