import { Plus } from '@phosphor-icons/react'
import { Button, Card, DataTable, type Column } from '../../../shared/ui'
import { formatNumber } from '../../../shared/lib/format'
import { COLORS } from '../engine/fields'
import { defaultRuleText, exitRuleText } from '../engine/rules'
import type { StatusDef } from '../types'

interface StatusTableProps {
  statuses?: StatusDef[]
  usersNow?: Record<string, number>
  canEdit: boolean
  onAdd: () => void
  onEdit: (status: StatusDef) => void
}

export function StatusTable({ statuses, usersNow, canEdit, onAdd, onEdit }: StatusTableProps) {
  const columns: Column<StatusDef>[] = [
    { key: 'order', header: '#', width: 28, render: (s) => <span className="text-12 font-medium text-ink-faint">{s.order}</span> },
    {
      key: 'name',
      header: 'STATUS',
      width: 160,
      render: (s) => (
        <span className="inline-flex items-center gap-2 text-13 font-bold">
          <span className="size-2.5 flex-none rounded-[3px]" style={{ background: COLORS[s.color].hex }} />
          {s.name}
        </span>
      ),
    },
    {
      key: 'entry',
      header: 'ENTRY CONDITION',
      width: 250,
      render: (s) => <code className="rounded-md bg-surface-alt px-2.5 py-1.5 font-mono text-11 leading-snug font-medium break-words">{defaultRuleText(s)}</code>,
    },
    { key: 'exit', header: 'EXIT CONDITION', render: (s) => <span className="font-mono text-11 font-medium text-ink-muted">{exitRuleText(s)}</span> },
    { key: 'copy', header: 'APP COPY', width: 200, render: (s) => <span className="text-12 font-medium text-ink-muted">{s.copy}</span> },
    { key: 'users', header: 'USERS NOW', width: 90, render: (s) => <span className="text-13 font-bold">{usersNow?.[s.key] != null ? formatNumber(usersNow[s.key]!) : '—'}</span> },
  ]

  return (
    <Card className="gap-3.5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-16 font-bold">Status definitions</h2>
          <p className="text-12 font-medium text-ink-muted">Evaluated top-down · first match wins</p>
        </div>
        {canEdit && <Button variant="outline" onClick={onAdd} leadingIcon={<Plus size={16} />}>Add status</Button>}
      </header>
      <DataTable columns={columns} rows={statuses ?? []} rowKey={(s) => s.key} rowHeight={52} onRowClick={canEdit ? onEdit : undefined} />
    </Card>
  )
}
