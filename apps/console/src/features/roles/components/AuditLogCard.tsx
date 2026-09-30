import { DownloadSimple } from '@phosphor-icons/react'
import { Button, Card, DataTable, type Column } from '../../../shared/ui'
import { actionDot, actionText } from '../config/labels'
import type { AuditRow } from '../types'

const stamp = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })

const columns: Column<AuditRow>[] = [
  { key: 'time', header: 'TIME', width: 110, render: (r) => <span className="font-medium whitespace-nowrap text-ink-muted">{stamp.format(new Date(r.at)).replace(',', '')}</span> },
  { key: 'actor', header: 'ACTOR', width: 100, render: (r) => <span className="truncate font-bold">{r.actor ?? 'System'}</span> },
  {
    key: 'action',
    header: 'ACTION',
    render: (r) => (
      <span className="flex min-w-0 items-center gap-2">
        <span className="size-1.5 flex-none rounded-full" style={{ background: actionDot(r.action) }} />
        <span className="line-clamp-2 leading-snug">{actionText(r)}</span>
      </span>
    ),
  },
  { key: 'target', header: 'TARGET', width: 110, render: (r) => <span className="truncate font-mono text-11 font-medium">{r.resource ?? '—'}</span> },
  { key: 'ip', header: 'IP', width: 100, render: (r) => <span className="truncate font-mono text-11 font-medium text-ink-faint">{r.ip ?? '—'}</span> },
]

interface AuditLogCardProps {
  rows?: AuditRow[]
  exporting: boolean
  onExport: () => void
}

export function AuditLogCard({ rows, exporting, onExport }: AuditLogCardProps) {
  return (
    <Card className="gap-3.5 min-[1201px]:min-w-0 min-[1201px]:flex-1">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-15 font-bold">Audit log</h2>
          <p className="text-12 font-medium text-ink-muted">Immutable · retained 5 years (UU PDP)</p>
        </div>
        <Button variant="outline" onClick={onExport} disabled={exporting} leadingIcon={<DownloadSimple size={16} />}>
          {exporting ? 'Exporting…' : 'Export'}
        </Button>
      </header>
      <DataTable columns={columns} rows={rows ?? []} rowKey={(r) => String(r.id)} rowHeight={50} />
    </Card>
  )
}
