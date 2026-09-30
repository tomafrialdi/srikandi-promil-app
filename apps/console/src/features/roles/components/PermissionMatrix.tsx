import { Card, DataTable, type Column } from '../../../shared/ui'
import { LEVEL, LEVEL_ORDER } from '../config/labels'
import type { MatrixRole, RolesOverview } from '../types'

export function PermissionMatrix({ data }: { data?: RolesOverview }) {
  const columns: Column<MatrixRole>[] = [
    {
      key: 'role',
      header: 'ROLE',
      width: 220,
      render: (r) => (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-13 font-bold">{r.label}</span>
          <span className="truncate text-11 font-medium text-ink-muted">{r.summary}</span>
        </span>
      ),
    },
    { key: 'members', header: 'MEMBERS', width: 80, render: (r) => <span className="text-13 font-bold">{r.members}</span> },
    ...(data?.columns ?? []).map<Column<MatrixRole>>((c, index) => ({
      key: c.key,
      header: c.label.toUpperCase(),
      align: 'center',
      render: (r) => {
        const level = LEVEL[r.levels[index] ?? 'none']
        const Icon = level.icon
        return <Icon size={18} className={level.className} aria-label={level.label} />
      },
    })),
  ]

  return (
    <Card className="gap-3.5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-15 font-bold">Permission matrix</h2>
          <p className="text-12 font-medium text-ink-muted">
            {data ? `${data.roles.length} roles · ${data.total_members} team members` : '…'}
          </p>
        </div>
        <ul className="m-0 flex list-none flex-wrap items-center gap-4 p-0" aria-label="Legend">
          {LEVEL_ORDER.map((key) => {
            const level = LEVEL[key]
            const Icon = level.icon
            return (
              <li key={key} className="inline-flex items-center gap-1.5 text-12 font-medium text-ink-muted">
                <Icon size={14} className={level.className} />
                {level.label}
              </li>
            )
          })}
        </ul>
      </header>
      <DataTable columns={columns} rows={data?.roles ?? []} rowKey={(r) => r.role} rowHeight={58} />
    </Card>
  )
}
