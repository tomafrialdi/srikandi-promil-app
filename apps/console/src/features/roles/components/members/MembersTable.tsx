import { ArrowCounterClockwise, PencilSimple, ProhibitInset, Trash } from '@phosphor-icons/react'
import { ActionMenu, Avatar, Badge, Card, CountTabs, DataTable, Pagination, type ActionMenuItem, type Column } from '../../../../shared/ui'
import { timeAgo } from '../../../../shared/lib/format'
import { MEMBER_STATUS, MEMBERS_PAGE_SIZE, TFA } from '../../config/members'
import { ROLE_TONE } from '../../config/labels'
import type { RoleCatalog } from '../../../users/types'
import type { MemberRow, MembersFilters, MembersList, MembersSummary } from '../../types'
import { MembersFilterBar, type MemberFilterKey } from './MembersFilterBar'

const joinedFormat = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })

interface MembersTableProps {
  summary?: MembersSummary
  roles: RoleCatalog['roles']
  list?: MembersList
  loading: boolean
  error?: string
  filters: MembersFilters
  page: number
  onFilter: (key: MemberFilterKey, value: string) => void
  onPage: (page: number) => void
  onEdit: (member: MemberRow) => void
  onToggleActive: (member: MemberRow) => void
  onRemove: (member: MemberRow) => void
  onRetry: () => void
}

export function MembersTable(props: MembersTableProps) {
  const { summary, list, loading, error, filters, page } = props
  const rows = list?.rows ?? []

  const menuFor = (m: MemberRow): ActionMenuItem[] => [
    { key: 'edit', label: 'Edit member', icon: <PencilSimple size={15} />, onSelect: () => props.onEdit(m) },
    m.status === 'active'
      ? { key: 'suspend', label: 'Suspend access', icon: <ProhibitInset size={15} />, onSelect: () => props.onToggleActive(m) }
      : { key: 'reactivate', label: 'Reactivate', icon: <ArrowCounterClockwise size={15} />, onSelect: () => props.onToggleActive(m) },
    { key: 'remove', label: 'Remove member', icon: <Trash size={15} />, tone: 'danger', onSelect: () => props.onRemove(m) },
  ]

  const columns: Column<MemberRow>[] = [
    {
      key: 'member',
      header: 'MEMBER',
      render: (m) => (
        <span className="inline-flex min-w-0 items-center gap-2.5">
          <Avatar label={m.name.replace(/^dr\.\s*/i, '').charAt(0).toUpperCase()} size={34} />
          <span className="flex min-w-0 flex-col">
            <span className="flex items-center gap-1.5 truncate text-13 font-bold">
              {m.name}
              {m.is_me && <span className="rounded-full bg-surface-alt px-1.5 py-px text-10 font-bold text-ink-muted">You</span>}
            </span>
            <span className="truncate text-12 font-medium text-ink-muted">{m.email}</span>
          </span>
        </span>
      ),
    },
    { key: 'role', header: 'ROLE', width: 150, render: (m) => <Badge tone={ROLE_TONE[m.role] ?? 'neutral'}>{m.role_label}</Badge> },
    {
      key: 'department',
      header: 'DEPARTMENT',
      width: 170,
      render: (m) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-13 font-semibold">{m.department ?? '—'}</span>
          {m.job_title && <span className="truncate text-11 font-medium text-ink-muted">{m.job_title}</span>}
        </span>
      ),
    },
    {
      key: 'tfa',
      header: '2FA',
      width: 120,
      render: (m) => {
        const t = TFA[m.tfa]
        const Glyph = t.icon
        return (
          <span className="inline-flex items-center gap-1.5 text-12 font-semibold">
            <Glyph size={15} className={t.className} />
            {t.label}
          </span>
        )
      },
    },
    {
      key: 'last',
      header: 'LAST ACTIVE',
      width: 100,
      render: (m) =>
        m.online ? (
          <span className="text-12 font-semibold text-success">Online</span>
        ) : (
          <span className="text-12 font-medium text-ink-muted">{m.last_seen ? timeAgo(m.last_seen) : '—'}</span>
        ),
    },
    { key: 'joined', header: 'JOINED', width: 100, render: (m) => <span className="text-12 font-medium text-ink-muted">{joinedFormat.format(new Date(m.joined))}</span> },
    {
      key: 'status',
      header: 'STATUS',
      width: 110,
      render: (m) => {
        const s = MEMBER_STATUS[m.status]
        return (
          <Badge tone={s.tone}>
            <span className="mr-1.5 inline-block size-1.5 rounded-full" style={{ background: s.dot }} />
            {s.label}
          </Badge>
        )
      },
    },
    { key: 'menu', header: '', width: 32, render: (m) => (m.can_manage && summary?.can_manage ? <ActionMenu label={`Actions for ${m.name}`} items={menuFor(m)} /> : null) },
  ]

  const tabs = [
    { key: 'all', label: 'All members', count: summary?.counts.all },
    { key: 'active', label: 'Active', count: summary?.counts.active },
    { key: 'suspended', label: 'Suspended', count: summary?.counts.suspended },
  ]

  return (
    <Card className="gap-3.5">
      <CountTabs tabs={tabs} active={filters.tab} onChange={(key) => props.onFilter('tab', key)} />
      <MembersFilterBar filters={filters} departments={summary?.departments ?? []} roles={props.roles} onChange={props.onFilter} />

      <div style={{ opacity: loading && list ? 0.55 : 1, transition: 'opacity 0.15s' }}>
        {error && !list ? (
          <p className="py-8 text-center text-13 text-ink-muted">
            {error} <button type="button" className="font-bold text-primary" onClick={props.onRetry}>Try again</button>
          </p>
        ) : rows.length === 0 && !loading ? (
          <p className="py-8 text-center text-13 text-ink-muted">No team members match these filters.</p>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(m) => m.id}
            rowHeight={58}
            onRowClick={(m) => m.can_manage && summary?.can_manage && props.onEdit(m)}
          />
        )}
      </div>

      <Pagination page={page} pageSize={MEMBERS_PAGE_SIZE} total={list?.total ?? 0} onChange={props.onPage} />
    </Card>
  )
}
