import { DotsThree } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { Badge, Card, Checkbox, CountTabs, DataTable, Pagination, type Column } from '../../../../shared/ui'
import { formatCompact } from '../../../../shared/lib/format'
import { ikUrl } from '../../../../shared/services/imagekit.service'
import { PAGE_SIZE, STATUS_BADGE, TYPE_META } from '../../config/labels'
import type { ContentFilters, ContentList, ContentRow, ContentSummary } from '../../types'
import { ContentBulkBar } from './ContentBulkBar'
import { ContentFilterBar } from './ContentFilterBar'

const updatedFormat = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'Asia/Jakarta' })

/** Reads for articles, views for tips/videos, CTR for cards. */
function reach(row: ContentRow): string {
  if (row.type === 'in_app_card') return row.ctr_pct != null ? `${row.ctr_pct}% CTR` : '—'
  if (row.views_30d <= 0) return '—'
  return row.type === 'article' ? formatCompact(row.views_30d) : `${formatCompact(row.views_30d)} views`
}

type FilterKey = 'tab' | 'search' | 'type' | 'category' | 'reviewer' | 'lang'

interface ContentTableProps {
  summary?: ContentSummary
  list?: ContentList
  loading: boolean
  error?: string
  filters: ContentFilters
  page: number
  selected: Set<string>
  busy: boolean
  onFilter: (key: FilterKey, value: string) => void
  onPage: (page: number) => void
  onSelect: (ids: string[], checked: boolean) => void
  onClearSelection: () => void
  onSendToReview: () => void
  onApprove?: () => void
  onSchedule: () => void
  onArchive: () => void
  onRetry: () => void
}

export function ContentTable(props: ContentTableProps) {
  const { summary, list, loading, error, filters, page, selected } = props
  const navigate = useNavigate()
  const rows = list?.rows ?? []
  const pageIds = rows.map((r) => r.id)
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const someSelected = pageIds.some((id) => selected.has(id))

  const columns: Column<ContentRow>[] = [
    {
      key: 'select',
      header: '',
      width: 24,
      render: (r) => <Checkbox checked={selected.has(r.id)} onChange={(checked) => props.onSelect([r.id], checked)} label={`Select ${r.title}`} />,
    },
    {
      key: 'content',
      header: 'CONTENT',
      render: (r) => {
        const Icon = TYPE_META[r.type].icon
        return (
          <span className="inline-flex min-w-0 items-center gap-3">
            <span className="inline-flex h-9 w-12 flex-none items-center justify-center overflow-hidden rounded-lg bg-primary-soft text-primary">
              {r.image_url ? <img src={ikUrl(r.image_url, { w: 96, h: 72 })} alt="" className="size-full object-cover" loading="lazy" /> : <Icon size={15} />}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-13 font-bold">{r.title}</span>
              <span className="truncate text-11 font-medium text-ink-muted">{r.sub}</span>
            </span>
          </span>
        )
      },
    },
    {
      key: 'type',
      header: 'TYPE',
      width: 108,
      render: (r) => {
        const { label, icon: Icon } = TYPE_META[r.type]
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-alt px-2 py-1 text-11 font-bold whitespace-nowrap">
            <Icon size={12} />
            {label}
          </span>
        )
      },
    },
    { key: 'category', header: 'CATEGORY', width: 88, render: (r) => <span className="text-12 font-medium">{r.category}</span> },
    {
      key: 'status',
      header: 'STATUS',
      width: 138,
      render: (r) => {
        const s = STATUS_BADGE[r.status]
        return (
          <Badge tone={s.tone}>
            <span className="mr-1.5 inline-block size-1.5 rounded-full" style={{ background: s.dot }} />
            {s.label}
          </Badge>
        )
      },
    },
    {
      key: 'reviewer',
      header: 'REVIEWER',
      width: 116,
      render: (r) =>
        r.reviewer ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex size-6 flex-none items-center justify-center rounded-full bg-primary-soft text-11 font-bold text-primary">
              {r.reviewer.replace(/^dr\.\s*/i, '').charAt(0)}
            </span>
            <span className="truncate text-12 font-medium">{r.reviewer}</span>
          </span>
        ) : (
          <span className="text-12 font-medium text-ink-muted">Not required</span>
        ),
    },
    {
      key: 'lang',
      header: 'LANG',
      width: 58,
      render: (r) => (
        <span className="inline-flex gap-1">
          {r.languages.map((l) => (
            <span key={l} className="rounded bg-surface-alt px-1 py-0.5 text-10 font-bold text-ink-muted">{l.toUpperCase()}</span>
          ))}
        </span>
      ),
    },
    { key: 'reach', header: 'READS', width: 76, render: (r) => <span className="text-12 font-semibold">{reach(r)}</span> },
    { key: 'updated', header: 'UPDATED', width: 62, render: (r) => <span className="text-12 font-medium text-ink-muted">{updatedFormat.format(new Date(r.updated_at))}</span> },
    { key: 'menu', header: '', width: 24, render: () => <DotsThree size={18} weight="bold" color="var(--ink-muted)" /> },
  ]

  const c = summary?.counts
  const tabs = [
    { key: 'all', label: 'All', count: c?.all },
    { key: 'draft', label: 'Drafts', count: c?.draft },
    { key: 'medical_review', label: 'Medical review', count: c?.medical_review },
    { key: 'scheduled', label: 'Scheduled', count: c?.scheduled },
    { key: 'published', label: 'Published', count: c?.published },
    { key: 'archived', label: 'Archived', count: c?.archived },
  ]

  return (
    <Card className="gap-3.5">
      <CountTabs tabs={tabs} active={filters.tab} onChange={(key) => props.onFilter('tab', key)} />
      <ContentFilterBar filters={filters} summary={summary} onChange={props.onFilter} />

      {selected.size > 0 && (
        <ContentBulkBar
          count={selected.size}
          busy={props.busy}
          onSendToReview={props.onSendToReview}
          onApprove={props.onApprove}
          onSchedule={props.onSchedule}
          onArchive={props.onArchive}
          onClear={props.onClearSelection}
        />
      )}

      {rows.length > 0 && (
        <label className="inline-flex items-center gap-2.5 self-start text-12 font-semibold text-ink-muted">
          <Checkbox checked={allSelected} indeterminate={!allSelected && someSelected} onChange={(checked) => props.onSelect(pageIds, checked)} label="Select all content on this page" />
          Select all on this page
        </label>
      )}

      <div className={loading && list ? 'opacity-55 transition-opacity' : 'transition-opacity'}>
        {error && !list ? (
          <p className="py-8 text-center text-13 text-ink-muted">
            {error} <button type="button" className="font-bold text-primary" onClick={props.onRetry}>Try again</button>
          </p>
        ) : rows.length === 0 && !loading ? (
          <p className="py-8 text-center text-13 text-ink-muted">No content matches these filters.</p>
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} rowHeight={64} isRowSelected={(r) => selected.has(r.id)} onRowClick={(r) => navigate(`/content-library/${r.id}`)} />
        )}
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={list?.total ?? 0} onChange={props.onPage} />
    </Card>
  )
}
