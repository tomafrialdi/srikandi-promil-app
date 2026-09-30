import { Lock } from '@phosphor-icons/react'
import { Badge, Card, DataTable, type Column } from '../../../shared/ui'
import { formatNumber } from '../../../shared/lib/format'
import { GROUP_STATUS } from '../config/labels'
import type { GroupRow, GroupsData } from '../types'

const columns: Column<GroupRow>[] = [
  {
    key: 'group',
    header: 'GROUP',
    render: (r) => (
      <span className="inline-flex items-center gap-2 text-13 font-bold">
        {r.name}
        {r.visibility === 'private' && <Lock size={12} className="text-ink-muted" aria-label="Private group" />}
      </span>
    ),
  },
  { key: 'members', header: 'MEMBERS', width: 100, render: (r) => <span className="text-13 font-semibold">{formatNumber(r.members)}</span> },
  { key: 'posts', header: 'POSTS / DAY', width: 100, render: (r) => <span className="text-13 font-semibold">{formatNumber(r.posts_per_day)}</span> },
  { key: 'reports', header: 'REPORTS (7D)', width: 110, render: (r) => <span className={r.reports_7d >= 15 ? 'text-13 font-bold text-error' : 'text-13 font-semibold'}>{r.reports_7d}</span> },
  { key: 'mods', header: 'MODERATORS', width: 170, render: (r) => <span className="truncate text-12 font-medium text-ink-muted">{r.moderators.join(', ') || '—'}</span> },
  {
    key: 'status',
    header: 'STATUS',
    width: 110,
    render: (r) => {
      const s = GROUP_STATUS[r.status]
      return (
        <Badge tone={s.tone}>
          <span className="mr-1.5 inline-block size-1.5 rounded-full" style={{ background: s.dot }} />
          {s.label}
        </Badge>
      )
    },
  },
]

export function GroupsTable({ data }: { data?: GroupsData }) {
  return (
    <Card className="gap-3.5">
      <header className="flex flex-col gap-0.5">
        <h2 className="text-15 font-bold">Groups</h2>
        <p className="text-12 font-medium text-ink-muted">{data ? `${data.public} public groups · ${data.private} private (clinic-hosted)` : '…'}</p>
      </header>
      <DataTable columns={columns} rows={data?.rows ?? []} rowKey={(r) => r.id} rowHeight={52} />
    </Card>
  )
}
