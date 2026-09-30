import { MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Badge, Card, CountTabs, DataTable, Pagination, SelectField, type Column } from '../../../shared/ui'
import { formatNumber } from '../../../shared/lib/format'
import { CATEGORY_TONE, NEUTRAL_TONE, PAGE_SIZE, RX_FILTER, STATUS, TYPE, TYPE_FILTER } from '../config/labels'
import type { MedRow, MedsFilters, MedsList, MedsSummary } from '../types'

export type MedFilterKey = 'tab' | 'search' | 'type' | 'rx'

interface CatalogueCardProps {
  summary?: MedsSummary
  list?: MedsList
  loading: boolean
  error?: string
  filters: MedsFilters
  page: number
  selected: string | null
  onFilter: (key: MedFilterKey, value: string) => void
  onPage: (page: number) => void
  onSelect: (id: string) => void
  onRetry: () => void
}

const columns = (): Column<MedRow>[] => [
  {
    key: 'name',
    header: 'MEDICATION',
    render: (m) => {
      const tone = CATEGORY_TONE[m.category] ?? NEUTRAL_TONE
      const Glyph = TYPE[m.type].icon
      return (
        <span className="inline-flex min-w-0 items-center gap-2.5">
          <span className="inline-flex size-9 flex-none items-center justify-center rounded-[10px]" style={{ background: tone.bg, color: tone.fg }}>
            <Glyph size={17} />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-13 font-bold">{m.name}</span>
            <span className="truncate text-11 font-medium text-ink-muted">{m.brands.join(', ') || m.generic_name}</span>
          </span>
        </span>
      )
    },
  },
  { key: 'category', header: 'CATEGORY', width: 130, render: (m) => <span className="text-12 font-medium">{m.category}</span> },
  { key: 'rx', header: 'RX', width: 52, render: (m) => <Badge tone={m.rx ? 'warning' : 'neutral'}>{m.rx ? 'Rx' : 'OTC'}</Badge> },
  { key: 'users', header: 'USERS', width: 64, render: (m) => <span className="text-12 font-semibold">{formatNumber(m.users)}</span> },
  { key: 'adherence', header: 'ADHERENCE', width: 84, render: (m) => <span className="text-12 font-semibold">{m.adherence != null ? `${m.adherence}%` : '—'}</span> },
  {
    key: 'status',
    header: 'STATUS',
    width: 108,
    render: (m) => {
      const s = STATUS[m.status]
      return (
        <Badge tone={m.has_revision ? 'warning' : s.tone}>
          <span className="mr-1.5 inline-block size-1.5 rounded-full" style={{ background: m.has_revision ? 'var(--warning)' : s.dot }} />
          {m.has_revision ? 'Changes in review' : s.label}
        </Badge>
      )
    },
  },
]

export function CatalogueCard(props: CatalogueCardProps) {
  const { summary, list, loading, error, filters, page, selected } = props
  const [draft, setDraft] = useState(filters.search)
  useEffect(() => {
    if (draft === filters.search) return
    const id = window.setTimeout(() => props.onFilter('search', draft.trim()), 300)
    return () => window.clearTimeout(id)
  }, [draft, filters.search, props])

  const tabs = [
    { key: 'all', label: 'All', count: summary?.counts.all },
    { key: 'supplements', label: 'Supplements', count: summary?.counts.supplements },
    { key: 'ovulation', label: 'Ovulation induction', count: summary?.counts.ovulation },
    { key: 'trigger_luteal', label: 'Trigger & luteal', count: summary?.counts.trigger_luteal },
    { key: 'drafts', label: 'Drafts', count: summary?.counts.drafts },
  ]
  const rows = list?.rows ?? []

  return (
    <Card className="min-w-0 gap-3.5">
      <CountTabs tabs={tabs} active={filters.tab} onChange={(k) => props.onFilter('tab', k)} />
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex h-9 w-64 max-w-full items-center gap-2 rounded-lg bg-surface px-3 focus-within:outline focus-within:outline-primary">
          <MagnifyingGlass size={15} color="var(--ink-faint)" />
          <input className="min-w-0 flex-1 border-0 bg-transparent text-13 outline-0 placeholder:text-ink-faint" placeholder="Search generic or brand name" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Search medications" />
        </label>
        <SelectField variant="pill" aria-label="Type" value={filters.type} options={TYPE_FILTER} onChange={(v) => props.onFilter('type', v)} />
        <SelectField variant="pill" aria-label="Rx" value={filters.rx} options={RX_FILTER} onChange={(v) => props.onFilter('rx', v)} />
      </div>
      <div style={{ opacity: loading && list ? 0.55 : 1, transition: 'opacity 0.15s' }}>
        {error && !list ? (
          <p className="py-8 text-center text-13 text-ink-muted">{error} <button type="button" className="font-bold text-primary" onClick={props.onRetry}>Try again</button></p>
        ) : rows.length === 0 && !loading ? (
          <p className="py-8 text-center text-13 text-ink-muted">No medications match these filters.</p>
        ) : (
          <DataTable columns={columns()} rows={rows} rowKey={(m) => m.id} rowHeight={60} isRowSelected={(m) => m.id === selected} onRowClick={(m) => props.onSelect(m.id)} />
        )}
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={list?.total ?? 0} onChange={props.onPage} />
    </Card>
  )
}
