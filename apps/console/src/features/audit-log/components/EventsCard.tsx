import { BookmarkSimple, Flag, MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Badge, Card, DataTable, PageState, Pagination, SelectField, type Column } from '../../../shared/ui'
import { cn } from '../../../shared/lib/cn'
import { CATEGORIES, CATEGORY_TONE, RANGES, RISK_LABEL, RISK_OPTIONS, RISK_TONE, categoryLabel } from '../config/labels'
import { PAGE_SIZE } from '../hooks/useAuditData'
import { eventTime, shortHash } from '../lib/format'
import type { AuditEvent, AuditList, Range, ViewFilters } from '../types'

const columns: Column<AuditEvent>[] = [
  { key: 'time', header: 'TIME', width: 104, render: (r) => <span className="font-mono text-11 font-medium whitespace-nowrap text-ink-muted">{eventTime(r.at)}</span> },
  {
    key: 'actor',
    header: 'ACTOR',
    width: 150,
    render: (r) => (
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-bold">{r.actor.name}</span>
        <span className="truncate text-11 font-medium text-ink-faint">{r.actor.role ?? '—'}</span>
      </span>
    ),
  },
  { key: 'category', header: 'CATEGORY', width: 104, render: (r) => <Badge tone={CATEGORY_TONE[r.category] ?? 'neutral'}>{categoryLabel(r.category)}</Badge> },
  {
    key: 'action',
    header: 'ACTION',
    render: (r) => (
      <span className="flex min-w-0 items-center gap-1.5">
        {r.flagged && <Flag size={12} weight="fill" className="flex-none text-error" aria-label="Flagged for DPO" />}
        <span className="line-clamp-2 leading-snug">{r.summary ?? r.action}</span>
      </span>
    ),
  },
  { key: 'target', header: 'TARGET', width: 130, render: (r) => <span className="truncate font-mono text-11 font-medium">{r.resource ?? '—'}</span> },
  { key: 'source', header: 'SOURCE', width: 150, render: (r) => <span className="truncate text-11 font-medium text-ink-faint">{[r.ip, r.device?.split(' · ')[0]].filter(Boolean).join(' · ') || '—'}</span> },
  { key: 'risk', header: 'RISK', width: 64, render: (r) => <Badge tone={RISK_TONE[r.risk]}>{RISK_LABEL[r.risk]}</Badge> },
]

interface EventsCardProps {
  filters: ViewFilters
  list?: AuditList
  loading: boolean
  error?: string
  page: number
  verified: boolean | null
  onFilter: (key: 'category' | 'risk' | 'search' | 'range', value: string) => void
  onPage: (page: number) => void
  onOpen: (id: number) => void
  onSaveView: () => void
  onRetry: () => void
}

export function EventsCard({ filters, list, loading, error, page, verified, onFilter, onPage, onOpen, onSaveView, onRetry }: EventsCardProps) {
  const [search, setSearch] = useState(filters.search ?? '')

  useEffect(() => setSearch(filters.search ?? ''), [filters.search])
  useEffect(() => {
    if (search.trim() === (filters.search ?? '')) return
    const id = window.setTimeout(() => onFilter('search', search.trim()), 300)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const category = filters.category ?? ''
  const chips = [{ key: '', label: 'All' }, ...CATEGORIES]

  return (
    <Card className="gap-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex h-9 min-w-56 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 focus-within:border-primary max-[700px]:basis-full min-[1101px]:max-w-72 min-[1101px]:flex-none">
          <MagnifyingGlass size={15} className="text-ink-faint" />
          <input className="min-w-0 flex-1 border-0 bg-transparent text-13 font-semibold outline-0 placeholder:text-ink-faint" placeholder="Actor, target ID, IP…" aria-label="Search the audit log" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Category">
          {chips.map((c) => (
            <button key={c.key} type="button" aria-pressed={category === c.key} onClick={() => onFilter('category', c.key)} className={cn('inline-flex h-8 items-center rounded-full px-3 text-12 font-bold', category === c.key ? 'bg-ink text-white' : 'bg-surface-alt text-ink-muted hover:text-ink')}>
              {c.label}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <SelectField variant="pill" aria-label="Risk" value={filters.risk ?? ''} options={RISK_OPTIONS} onChange={(v) => onFilter('risk', v)} />
        <SelectField variant="pill" aria-label="Period" value={filters.range ?? '24h'} options={RANGES.map((r) => ({ value: r.value, label: r.label }))} onChange={(v) => onFilter('range', v as Range)} />
        <button type="button" onClick={onSaveView} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-12 font-bold text-ink-muted hover:text-ink">
          <BookmarkSimple size={14} /> Save view
        </button>
      </div>

      {error && !list ? (
        <PageState title="The audit log could not be loaded" description={error} action={<button type="button" className="text-13 font-bold text-primary" onClick={onRetry}>Try again</button>} />
      ) : !list ? (
        <PageState title="Loading events…" />
      ) : list.rows.length === 0 ? (
        <PageState title="No events match these filters" description="Widen the period or clear the category and risk filters." />
      ) : (
        <div className={cn('transition-opacity', loading && 'opacity-60')}>
          <DataTable columns={columns} rows={list.rows} rowKey={(r) => String(r.id)} rowHeight={56} onRowClick={(r) => onOpen(r.id)} />
        </div>
      )}

      {list && (
        <div className="flex flex-col gap-2">
          <Pagination page={page} pageSize={PAGE_SIZE} total={list.total} onChange={onPage} />
          <p className="text-11 text-ink-faint">
            Chain head <span className="font-mono">{shortHash(list.head)}</span>{verified === true ? ' · verified' : verified === false ? ' · verification failed' : ''}
          </p>
        </div>
      )}
    </Card>
  )
}
