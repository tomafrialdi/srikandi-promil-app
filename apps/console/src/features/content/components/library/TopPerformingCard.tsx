import { Card } from '../../../../shared/ui'
import { formatCompact } from '../../../../shared/lib/format'
import type { ContentHighlights } from '../../types'

function label(item: ContentHighlights['top'][number]): string {
  if (item.type === 'in_app_card') return item.ctr_pct != null ? `${item.ctr_pct}% CTR` : '—'
  return `${formatCompact(item.views_30d)} ${item.type === 'article' ? 'reads' : 'views'}`
}

export function TopPerformingCard({ items }: { items?: ContentHighlights['top'] }) {
  return (
    <Card className="gap-2 min-[1201px]:flex-[2]">
      <h2 className="text-15 font-bold">Top performing (30d)</h2>
      {(items ?? []).map((item, index) => (
        <div key={item.id} className="flex items-center gap-3 py-1.5">
          <span className="w-4 text-13 font-extrabold text-ink-faint">{index + 1}</span>
          <span className="min-w-0 flex-1 truncate text-13 font-semibold">{item.title}</span>
          <span className="text-12 font-bold text-success">{label(item)}</span>
        </div>
      ))}
    </Card>
  )
}
