import { StatCard, StatGrid } from '../../../../shared/ui'
import { formatCompact, formatDuration } from '../../../../shared/lib/format'
import type { ContentSummary } from '../../types'

const nextSlot = new Intl.DateTimeFormat('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' })

export function ContentStats({ data }: { data?: ContentSummary }) {
  return (
    <StatGrid>
      <StatCard label="Published" value={data?.published ?? '—'} badge={data ? { tone: 'success', text: `↑ ${data.published_this_month} this month` } : null} />
      <StatCard
        label="In medical review"
        value={data?.in_review ?? '—'}
        badge={data ? { tone: data.past_sla > 0 ? 'warning' : 'neutral', text: data.past_sla > 0 ? `${data.past_sla} past SLA` : 'within SLA' } : null}
      />
      <StatCard
        label="Scheduled"
        value={data?.scheduled ?? '—'}
        badge={data?.next_scheduled_at ? { tone: 'info', text: `next: ${nextSlot.format(new Date(data.next_scheduled_at))}` } : null}
      />
      <StatCard
        label="Drafts"
        value={data?.drafts ?? '—'}
        badge={data ? { tone: data.stale_drafts > 0 ? 'warning' : 'neutral', text: `${data.stale_drafts} untouched > 30d` } : null}
      />
      <StatCard
        label="Reads (30d)"
        value={data ? formatCompact(data.reads_30d) : '—'}
        badge={data?.avg_read_seconds ? { tone: 'neutral', text: `avg ${formatDuration(data.avg_read_seconds)}` } : null}
      />
    </StatGrid>
  )
}
