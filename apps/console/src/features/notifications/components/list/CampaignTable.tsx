import { DotsThree } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { Badge, Card, CountTabs, DataTable, Pagination, type Column } from '../../../../shared/ui'
import { formatCompact } from '../../../../shared/lib/format'
import { CHANNEL_META, KIND_LABEL, PAGE_SIZE, STATUS_BADGE } from '../../config/labels'
import type { CampaignList, CampaignRow, NotificationsSummary } from '../../types'

const dayMonth = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', timeZone: 'Asia/Jakarta' })
const dayMonthTime = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' })
const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' })
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' })

function lastRun(row: CampaignRow): string {
  if (row.status === 'sending') return 'Now'
  if (row.status === 'scheduled' && row.send_at) return dayMonthTime.format(new Date(row.send_at)).replace(',', ',')
  if (!row.last_run_at) return '—'
  const at = new Date(row.last_run_at)
  return dayKey.format(at) === dayKey.format(new Date()) ? `Today ${clock.format(at)}` : dayMonth.format(at)
}

const dash = (value: string | null) => <span className="text-12 font-semibold">{value ?? '—'}</span>

interface CampaignTableProps {
  summary?: NotificationsSummary
  list?: CampaignList
  loading: boolean
  error?: string
  tab: string
  page: number
  onTab: (tab: string) => void
  onPage: (page: number) => void
  onRetry: () => void
}

export function CampaignTable({ summary, list, loading, error, tab, page, onTab, onPage, onRetry }: CampaignTableProps) {
  const navigate = useNavigate()
  const rows = list?.rows ?? []

  const columns: Column<CampaignRow>[] = [
    {
      key: 'campaign',
      header: 'CAMPAIGN',
      render: (r) => {
        const Icon = CHANNEL_META[r.channel].icon
        return (
          <span className="inline-flex min-w-0 items-center gap-2.5">
            <span className="inline-flex size-7 flex-none items-center justify-center rounded-lg bg-primary-soft text-primary" title={CHANNEL_META[r.channel].label}>
              <Icon size={14} />
            </span>
            <span className="truncate text-13 font-bold">{r.name}</span>
          </span>
        )
      },
    },
    { key: 'type', header: 'TYPE', width: 84, render: (r) => <span className="rounded-md bg-surface-alt px-2 py-1 text-11 font-bold">{KIND_LABEL[r.kind]}</span> },
    { key: 'audience', header: 'AUDIENCE', width: 148, render: (r) => <span className="truncate text-12 font-medium text-ink-muted">{r.audience}</span> },
    {
      key: 'status',
      header: 'STATUS',
      width: 128,
      render: (r) => {
        const s = STATUS_BADGE[r.status]
        return (
          <Badge tone={s.tone}>
            <span className="mr-1.5 inline-block size-1.5 rounded-full" style={{ background: s.dot }} />
            {r.status === 'sending' && r.progress_pct != null ? `Sending · ${r.progress_pct}%` : s.label}
          </Badge>
        )
      },
    },
    { key: 'sent', header: 'SENT', width: 56, render: (r) => dash(r.sent > 0 ? formatCompact(r.sent) : null) },
    { key: 'delivered', header: 'DELIVERED', width: 78, render: (r) => dash(r.delivered_pct != null && r.sent > 0 ? `${r.delivered_pct}%` : null) },
    { key: 'opened', header: 'OPENED', width: 62, render: (r) => dash(r.opened_pct != null && r.opened_pct > 0 ? `${r.opened_pct}%` : null) },
    { key: 'last', header: 'LAST RUN', width: 104, render: (r) => <span className="text-12 font-medium text-ink-muted">{lastRun(r)}</span> },
    { key: 'menu', header: '', width: 24, render: () => <DotsThree size={18} weight="bold" color="var(--ink-muted)" /> },
  ]

  const c = summary?.counts
  const tabs = [
    { key: 'all', label: 'All', count: c?.all },
    { key: 'active', label: 'Active triggers', count: c?.active },
    { key: 'scheduled', label: 'Scheduled', count: c?.scheduled },
    { key: 'sent', label: 'Sent', count: c?.sent },
    { key: 'drafts', label: 'Drafts', count: c?.drafts },
    { key: 'failed', label: 'Failed', count: c?.failed },
  ]

  return (
    <Card className="gap-3.5">
      <CountTabs tabs={tabs} active={tab} onChange={onTab} />
      <div className={loading && list ? 'opacity-55 transition-opacity' : 'transition-opacity'}>
        {error && !list ? (
          <p className="py-8 text-center text-13 text-ink-muted">
            {error} <button type="button" className="font-bold text-primary" onClick={onRetry}>Try again</button>
          </p>
        ) : rows.length === 0 && !loading ? (
          <p className="py-8 text-center text-13 text-ink-muted">No campaigns here yet.</p>
        ) : (
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} rowHeight={56} onRowClick={(r) => navigate(`/notifications/${r.id}`)} />
        )}
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={list?.total ?? 0} onChange={onPage} />
    </Card>
  )
}
