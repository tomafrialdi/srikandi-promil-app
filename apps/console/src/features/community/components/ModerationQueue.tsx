import { Card } from '../../../shared/ui'
import { cn } from '../../../shared/lib/cn'
import { REASON, queueTag, shortAge } from '../config/labels'
import type { CommunitySummary, QueueItem, QueueTab } from '../types'

interface ModerationQueueProps {
  summary?: CommunitySummary
  tab: QueueTab
  items?: QueueItem[]
  loading: boolean
  error?: string
  selected: string | null
  onTab: (tab: QueueTab) => void
  onSelect: (id: string) => void
  onRetry: () => void
}

const TABS: Array<{ key: QueueTab; label: string }> = [
  { key: 'reported', label: 'Reported' },
  { key: 'ai_flagged', label: 'AI flagged' },
  { key: 'appeals', label: 'Appeals' },
]

export function ModerationQueue({ summary, tab, items, loading, error, selected, onTab, onSelect, onRetry }: ModerationQueueProps) {
  return (
    <Card className="gap-0 p-0 min-[1201px]:w-105 min-[1201px]:flex-none">
      <header className="flex flex-col gap-3 border-b border-border p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-15 font-bold">Moderation queue</h2>
          <span className="text-12 text-ink-muted">Sorted by risk</span>
        </div>
        <div className="flex gap-1.5" role="tablist" aria-label="Queue">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={t.key === tab}
              className={cn('h-7 rounded-lg px-2.5 text-12 font-bold whitespace-nowrap', t.key === tab ? 'bg-primary-soft text-primary' : 'bg-surface-alt text-ink-muted')}
              onClick={() => onTab(t.key)}
            >
              {t.label} · {summary?.counts[t.key] ?? '…'}
            </button>
          ))}
        </div>
      </header>

      <div className={cn('flex max-h-136 flex-col overflow-y-auto', loading && items && 'opacity-55')} data-lenis-prevent>
        {error && !items ? (
          <p className="p-6 text-center text-13 text-ink-muted">
            {error} <button type="button" className="font-bold text-primary" onClick={onRetry}>Try again</button>
          </p>
        ) : items && items.length === 0 ? (
          <p className="p-8 text-center text-13 text-ink-muted">The queue is clear. Nice work.</p>
        ) : (
          (items ?? []).map((item) => {
            const reason = REASON[item.reason]
            const active = item.id === selected
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active}
                className={cn('flex flex-col gap-1.5 border-b border-border px-4 py-3 text-left last:border-b-0', active ? 'bg-error-soft/50' : 'hover:bg-surface')}
                onClick={() => onSelect(item.id)}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-11 font-bold', reason.tone === 'error' ? 'bg-error-soft text-error' : 'bg-surface-alt text-ink')}>
                    <span className="size-1.5 rounded-full" style={{ background: reason.dot }} />
                    {reason.label}
                  </span>
                  <span className="text-11 font-semibold text-ink-muted">{shortAge(item.flagged_at)}</span>
                </span>
                <span className="truncate text-13 font-semibold">“{item.excerpt}”</span>
                <span className="flex items-center justify-between gap-3 text-11">
                  <span className="truncate text-ink-muted">{item.author} · {item.group}</span>
                  <span className={cn('font-bold', item.reason === 'self_harm' ? 'text-error' : 'text-ink-muted')}>{queueTag(item)}</span>
                </span>
              </button>
            )
          })
        )}
      </div>
    </Card>
  )
}
