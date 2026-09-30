import { MagnifyingGlass, Warning } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { cn } from '../../../shared/lib/cn'
import { Card, CountTabs, SelectField } from '../../../shared/ui'
import { CATEGORY, CHANNEL, PRIORITY, STATUS_FILTER } from '../config/labels'
import { firstName, shortAge } from '../lib/format'
import type { SupportSummary, TicketFilters, TicketsList } from '../types'

export type TicketFilterKey = 'tab' | 'search' | 'status'

interface TicketListProps {
  summary?: SupportSummary
  list?: TicketsList
  loading: boolean
  error?: string
  filters: TicketFilters
  selected: string | null
  onFilter: (key: TicketFilterKey, value: string) => void
  onSelect: (id: string) => void
  onRetry: () => void
}

export function TicketList(props: TicketListProps) {
  const { summary, list, loading, error, filters, selected } = props
  const [draft, setDraft] = useState(filters.search)
  useEffect(() => {
    if (draft === filters.search) return
    const id = window.setTimeout(() => props.onFilter('search', draft.trim()), 300)
    return () => window.clearTimeout(id)
  }, [draft, filters.search, props])

  const tabs = [
    { key: 'mine', label: 'Mine', count: summary?.counts.mine },
    { key: 'unassigned', label: 'Unassigned', count: summary?.counts.unassigned },
    { key: 'all', label: 'All', count: summary?.counts.all },
  ]
  const rows = list?.rows ?? []

  return (
    <Card className="min-w-0 gap-3 p-0">
      <div className="flex flex-col gap-3 px-5 pt-5">
        <CountTabs tabs={tabs} active={filters.tab} onChange={(k) => props.onFilter('tab', k)} />
        <div className="flex items-center gap-2 pb-1">
          <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg bg-surface px-3 focus-within:outline focus-within:outline-primary">
            <MagnifyingGlass size={15} color="var(--ink-faint)" />
            <input className="min-w-0 flex-1 border-0 bg-transparent text-13 outline-0 placeholder:text-ink-faint" placeholder="Search subject, name or #TCK" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Search tickets" />
          </label>
          <SelectField variant="pill" aria-label="Status" value={filters.status} options={STATUS_FILTER} onChange={(v) => props.onFilter('status', v)} />
        </div>
      </div>
      <div style={{ opacity: loading && list ? 0.55 : 1, transition: 'opacity 0.15s' }}>
        {error && !list ? (
          <p className="px-5 py-8 text-center text-13 text-ink-muted">{error} <button type="button" className="font-bold text-primary" onClick={props.onRetry}>Try again</button></p>
        ) : rows.length === 0 && !loading ? (
          <p className="px-5 py-10 text-center text-13 text-ink-muted">No tickets here. 🎉</p>
        ) : (
          <ul className="m-0 flex max-h-[640px] list-none flex-col overflow-y-auto p-0" data-lenis-prevent>
            {rows.map((t) => {
              const p = PRIORITY[t.priority]
              const on = t.id === selected
              const Ch = CHANNEL[t.channel].icon
              return (
                <li key={t.id}>
                  <button type="button" aria-current={on} onClick={() => props.onSelect(t.id)} className={cn('flex w-full flex-col gap-1.5 border-t border-l-[3px] border-border px-5 py-3.5 text-left', on ? 'border-l-primary bg-primary-soft' : 'border-l-transparent hover:bg-surface')}>
                    <span className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-11 font-bold" style={{ color: p.fg, background: p.bg }}>
                        <span className="size-1.5 rounded-full" style={{ background: p.fg }} />{p.label}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-11 text-ink-faint">
                        {t.status === 'resolved' && <span className="font-semibold text-success">Resolved</span>}
                        {t.escalated_to && <Warning size={12} className="text-warning-ink" aria-label="Escalated" />}
                        {shortAge(t.last_message_at)}
                      </span>
                    </span>
                    <span className="text-13 leading-snug font-bold">{t.subject}</span>
                    <span className="flex items-center gap-1.5 text-11 text-ink-muted">
                      <Ch size={12} className="flex-none" />
                      <span className="truncate">{firstName(t.requester_name)} {t.requester_name.split(' ').slice(1).map((w) => w[0] + '.').join(' ')} · {CHANNEL[t.channel].label} · {CATEGORY[t.category]}{t.assigned_name ? ` · ${t.assigned_name}` : ''}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Card>
  )
}
