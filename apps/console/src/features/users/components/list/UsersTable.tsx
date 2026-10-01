import { DotsThree } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Badge, Card, Checkbox, CountTabs, DataTable, Pagination, type Column } from '../../../../shared/ui'
import { initials, timeAgo } from '../../../../shared/lib/format'
import { ikUrl } from '../../../../shared/services/imagekit.service'
import { MODE_LABEL, PLAN_BADGE } from '../../../../shared/lib/labels'
import { PAGE_SIZE, STATUS_BADGE } from '../../config/labels'
import type { UserRow, UsersFilters, UsersList, UsersSummary } from '../../types'
import { BulkBar } from './BulkBar'
import { UsersFilterBar } from './UsersFilterBar'

const joinedFormat = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })

interface UsersTableProps {
  summary?: UsersSummary
  list?: UsersList
  loading: boolean
  error?: string
  filters: UsersFilters
  page: number
  selected: Set<string>
  onFilter: (key: 'tab' | 'search' | 'plan' | 'mode' | 'city' | 'status', value: string) => void
  onPage: (page: number) => void
  onSelect: (ids: string[], checked: boolean) => void
  onClearSelection: () => void
  onGrantPlus: () => void
  onSuspend: () => void
  onRetry: () => void
}

export function UsersTable(props: UsersTableProps) {
  const { summary, list, loading, error, filters, page, selected } = props
  const navigate = useNavigate()
  const rows = list?.rows ?? []
  const pageIds = rows.map((r) => r.id)
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const someSelected = pageIds.some((id) => selected.has(id))

  const columns: Column<UserRow>[] = [
    {
      key: 'select',
      header: '',
      width: 32,
      render: (r) => (
        <Checkbox checked={selected.has(r.id)} onChange={(checked) => props.onSelect([r.id], checked)} label={`Select ${r.name}`} />
      ),
    },
    {
      key: 'user',
      header: 'USER',
      render: (r) => (
        <span className="inline-flex min-w-0 items-center gap-2.5">
          <Avatar label={initials(r.name)[0] ?? ''} size={34} src={ikUrl(r.avatar_url, { w: 80, h: 80 })} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-13 font-bold">{r.name}</span>
            <span className="truncate text-12 font-medium text-ink-muted">{r.email}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'plan',
      header: 'PLAN',
      width: 100,
      render: (r) => <Badge tone={PLAN_BADGE[r.plan].tone}>{PLAN_BADGE[r.plan].label}</Badge>,
    },
    { key: 'mode', header: 'MODE', width: 76, render: (r) => <span className="text-13 font-semibold">{MODE_LABEL[r.mode]}</span> },
    { key: 'phase', header: 'PHASE', width: 128, render: (r) => <span className="text-12 font-medium text-ink-muted">{r.phase}</span> },
    { key: 'logs', header: 'LOGS (7D)', width: 72, render: (r) => <span className="text-13 font-semibold">{r.logs_7d}</span> },
    { key: 'joined', header: 'JOINED', width: 100, render: (r) => <span className="text-12 font-medium text-ink-muted">{joinedFormat.format(new Date(r.joined))}</span> },
    {
      key: 'last',
      header: 'LAST ACTIVE',
      width: 96,
      render: (r) => <span className="text-12 font-medium text-ink-muted">{r.last_active_at ? timeAgo(r.last_active_at) : '—'}</span>,
    },
    {
      key: 'status',
      header: 'STATUS',
      width: 128,
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
    { key: 'menu', header: '', width: 28, render: () => <DotsThree size={18} weight="bold" color="var(--ink-muted)" /> },
  ]

  const tabs = [
    { key: 'all', label: 'All users', count: summary?.counts.all },
    { key: 'free', label: 'Free', count: summary?.counts.free },
    { key: 'paid', label: 'Paid', count: summary?.counts.paid },
    { key: 'trial', label: 'Trial', count: summary?.counts.trial },
    { key: 'new', label: 'New', count: summary?.counts.new },
    { key: 'suspended', label: 'Suspended', count: summary?.counts.suspended },
  ]

  return (
    <Card className="gap-3.5">
      <CountTabs tabs={tabs} active={filters.tab} onChange={(key) => props.onFilter('tab', key)} />
      <UsersFilterBar filters={filters} cities={summary?.cities ?? []} onChange={props.onFilter} />

      {selected.size > 0 && (
        <BulkBar count={selected.size} onGrantPlus={props.onGrantPlus} onSuspend={props.onSuspend} onClear={props.onClearSelection} />
      )}

      {rows.length > 0 && (
        <label className="inline-flex items-center gap-2.5 self-start text-12 font-semibold text-ink-muted">
          <Checkbox
            checked={allSelected}
            indeterminate={!allSelected && someSelected}
            onChange={(checked) => props.onSelect(pageIds, checked)}
            label="Select all users on this page"
          />
          Select all on this page
        </label>
      )}

      <div style={{ opacity: loading && list ? 0.55 : 1, transition: 'opacity 0.15s' }}>
        {error && !list ? (
          <p className="py-8 text-center text-13 text-ink-muted">
            {error} <button type="button" className="font-bold text-primary" onClick={props.onRetry}>Try again</button>
          </p>
        ) : rows.length === 0 && !loading ? (
          <p className="py-8 text-center text-13 text-ink-muted">No users match these filters.</p>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            rowHeight={56}
            isRowSelected={(r) => selected.has(r.id)}
            onRowClick={(r) => navigate(`/users/${r.id}`)}
          />
        )}
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={list?.total ?? 0} onChange={props.onPage} />
    </Card>
  )
}
