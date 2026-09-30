import { Badge, Card } from '../../../../shared/ui'
import type { ContentHighlights } from '../../types'

export function ReviewQueueCard({ items }: { items?: ContentHighlights['review_queue'] }) {
  return (
    <Card className="gap-2 min-[1201px]:flex-[3]">
      <header className="flex items-center justify-between">
        <h2 className="text-15 font-bold">Medical review queue</h2>
        <Badge tone="neutral">SLA 48h</Badge>
      </header>
      {items && items.length === 0 && <p className="py-3 text-13 text-ink-muted">Nothing waiting for review.</p>}
      {(items ?? []).map((item) => (
        <div key={item.id} className="flex items-center gap-3 py-1.5">
          <span className="min-w-0 flex-1 truncate text-13 font-semibold">{item.title}</span>
          <span className="text-12 font-medium text-ink-muted">{item.reviewer ?? '—'}</span>
          {item.status === 'changes_requested' ? (
            <Badge tone="error">Changes requested</Badge>
          ) : (
            <Badge tone={item.past_sla ? 'error' : 'warning'}>{item.past_sla ? `${item.hours}h · past SLA` : `${item.hours}h in review`}</Badge>
          )}
        </div>
      ))}
    </Card>
  )
}
