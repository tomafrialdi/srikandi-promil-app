import { MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Badge, Card, CountTabs, DataTable, Pagination, SelectField, type Column } from '../../../shared/ui'
import { BPJS_BADGE, BPJS_FILTER, PAGE_SIZE, TYPE, TYPE_FILTER, statusBadge } from '../config/labels'
import type { ClinicRow, ClinicsFilters, ClinicsList, ClinicsSummary } from '../types'

export type ClinicFilterKey = 'tab' | 'search' | 'city' | 'type' | 'bpjs'

interface ClinicsTableProps {
  summary?: ClinicsSummary
  list?: ClinicsList
  loading: boolean
  error?: string
  filters: ClinicsFilters
  page: number
  selected: string | null
  onFilter: (key: ClinicFilterKey, value: string) => void
  onPage: (page: number) => void
  onSelect: (id: string) => void
  onRetry: () => void
}

const columns: Column<ClinicRow>[] = [
  {
    key: 'name',
    header: 'CLINIC',
    render: (c) => (
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-13 font-bold">{c.name}</span>
        <span className="truncate text-11 font-medium text-ink-muted">{TYPE[c.type].short}{c.doctors > 0 ? ` · ${c.doctors} doctor${c.doctors === 1 ? '' : 's'}` : ''}</span>
      </span>
    ),
  },
  { key: 'city', header: 'CITY', width: 120, render: (c) => <span className="text-12 font-medium">{c.city}</span> },
  { key: 'bpjs', header: 'BPJS', width: 70, render: (c) => <Badge tone={BPJS_BADGE[c.bpjs_level].tone}>{BPJS_BADGE[c.bpjs_level].label}</Badge> },
  { key: 'rating', header: 'RATING', width: 70, render: (c) => <span className="text-12 font-semibold">{c.rating > 0 ? `★ ${Number(c.rating).toFixed(1)}` : '—'}</span> },
  { key: 'referrals', header: 'REFERRALS', width: 84, render: (c) => <span className="text-12 font-semibold">{c.referrals > 0 ? c.referrals : '—'}</span> },
  {
    key: 'status',
    header: 'STATUS',
    width: 108,
    render: (c) => {
      const s = statusBadge(c.status, c.tier)
      return (
        <Badge tone={s.tone}>
          <span className="mr-1.5 inline-block size-1.5 rounded-full" style={{ background: s.dot }} />
          {s.label}
        </Badge>
      )
    },
  },
]

export function ClinicsTable(props: ClinicsTableProps) {
  const { summary, list, loading, error, filters, page, selected } = props
  const [draft, setDraft] = useState(filters.search)
  useEffect(() => {
    if (draft === filters.search) return
    const id = window.setTimeout(() => props.onFilter('search', draft.trim()), 300)
    return () => window.clearTimeout(id)
  }, [draft, filters.search, props])

  const tabs = [
    { key: 'all', label: 'All', count: summary?.counts.all },
    { key: 'pending', label: 'Pending verification', count: summary?.counts.pending },
    { key: 'sponsors', label: 'Sponsors', count: summary?.counts.sponsors },
    { key: 'suspended', label: 'Suspended', count: summary?.counts.suspended },
  ]
  const rows = list?.rows ?? []

  return (
    <Card className="min-w-0 gap-3.5">
      <CountTabs tabs={tabs} active={filters.tab} onChange={(k) => props.onFilter('tab', k)} />
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex h-9 w-64 max-w-full items-center gap-2 rounded-lg bg-surface px-3 focus-within:outline focus-within:outline-primary">
          <MagnifyingGlass size={15} color="var(--ink-faint)" />
          <input className="min-w-0 flex-1 border-0 bg-transparent text-13 outline-0 placeholder:text-ink-faint" placeholder="Search clinic or doctor" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Search clinics" />
        </label>
        <SelectField variant="pill" aria-label="City" value={filters.city} options={[{ value: '', label: 'City: All' }, ...(summary?.cities ?? []).map((c) => ({ value: c, label: c }))]} onChange={(v) => props.onFilter('city', v)} />
        <SelectField variant="pill" aria-label="Type" value={filters.type} options={TYPE_FILTER} onChange={(v) => props.onFilter('type', v)} />
        <SelectField variant="pill" aria-label="BPJS" value={filters.bpjs} options={BPJS_FILTER} onChange={(v) => props.onFilter('bpjs', v)} />
      </div>
      <div style={{ opacity: loading && list ? 0.55 : 1, transition: 'opacity 0.15s' }}>
        {error && !list ? (
          <p className="py-8 text-center text-13 text-ink-muted">{error} <button type="button" className="font-bold text-primary" onClick={props.onRetry}>Try again</button></p>
        ) : rows.length === 0 && !loading ? (
          <p className="py-8 text-center text-13 text-ink-muted">No clinics match these filters.</p>
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(c) => c.id} rowHeight={58} isRowSelected={(c) => c.id === selected} onRowClick={(c) => props.onSelect(c.id)} />
        )}
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={list?.total ?? 0} onChange={props.onPage} />
    </Card>
  )
}
