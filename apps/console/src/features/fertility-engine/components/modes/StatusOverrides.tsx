import { PencilSimple } from '@phosphor-icons/react'
import { Card, DataTable, type Column } from '../../../../shared/ui'
import { COLORS } from '../../engine/fields'
import { defaultRuleText } from '../../engine/rules'
import type { ModeConfig, StatusDef, StatusOverride } from '../../types'

interface StatusOverridesProps {
  mode: ModeConfig
  statuses: StatusDef[]
  canEdit: boolean
  onEdit: (o: StatusOverride) => void
}

export function StatusOverrides({ mode, statuses, canEdit, onEdit }: StatusOverridesProps) {
  const byKey = new Map(statuses.map((s) => [s.key, s]))
  const columns: Column<StatusOverride>[] = [
    {
      key: 'status',
      header: 'STATUS',
      width: 170,
      render: (o) => {
        const def = byKey.get(o.status)
        const color = COLORS[o.color ?? def?.color ?? 'gray'].hex
        return (
          <span className="inline-flex items-center gap-2 text-13 font-bold">
            <span className="size-2.5 flex-none rounded-[3px]" style={{ background: color }} />
            {o.name ?? def?.name ?? o.status}
          </span>
        )
      },
    },
    {
      key: 'default',
      header: 'DEFAULT (TTC)',
      width: 250,
      render: (o) => {
        const def = byKey.get(o.status)
        return <code className="w-full truncate rounded-md bg-surface-alt px-2.5 py-1.5 font-mono text-11 font-medium">{def ? defaultRuleText(def) : '—'}</code>
      },
    },
    {
      key: 'mode',
      header: 'THIS MODE',
      width: 250,
      render: (o) => {
        const same = o.kind === 'same'
        return (
          <code className="w-full truncate rounded-md px-2.5 py-1.5 font-mono text-11 font-medium" style={same ? { background: 'var(--surface-alt)', color: 'var(--ink-faint)' } : { background: COLORS[mode.meta.color].soft }}>
            {same ? '— same as default' : o.rule ?? (o.kind === 'rename' ? `renamed → ${o.rename}` : o.kind)}
          </code>
        )
      },
    },
    { key: 'copy', header: 'APP COPY', render: (o) => <span className="text-12 font-medium text-ink-muted">{o.copy ?? byKey.get(o.status)?.copy ?? '—'}</span> },
    { key: 'edit', header: '', width: 28, render: () => (canEdit ? <PencilSimple size={15} className="text-ink-faint" /> : null) },
  ]

  return (
    <Card className="gap-3.5">
      <header className="flex flex-col gap-0.5">
        <h2 className="text-16 font-bold">Status rule overrides</h2>
        <p className="text-12 font-medium text-ink-muted">Changes to the status table for this mode{canEdit ? ' · click a row to edit' : ''}</p>
      </header>
      <DataTable columns={columns} rows={mode.status_overrides} rowKey={(o) => o.status} rowHeight={48} onRowClick={canEdit ? onEdit : undefined} />
    </Card>
  )
}
