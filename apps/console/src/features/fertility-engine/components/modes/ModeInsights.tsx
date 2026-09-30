import { Badge, Card, CardHeader } from '../../../../shared/ui'
import { fmtDate } from '../../lib'
import type { EngineEvent, Metric } from '../../types'

const DOT = { success: 'var(--success)', info: 'var(--secondary)', warning: 'var(--warning)', error: 'var(--error)' }

export function ModePerformance({ metrics }: { metrics: Metric[] }) {
  return (
    <Card className="gap-4">
      <CardHeader title="Performance in this mode" subtitle="Last 90 days" />
      <div className="grid gap-3 min-[701px]:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.key} className="flex flex-col gap-1.5 rounded-xl bg-surface px-3.5 py-3">
            <span className="text-11 font-semibold text-ink-muted">{m.label}</span>
            <span className={m.value.length > 9 ? 'text-18 leading-tight font-extrabold whitespace-nowrap' : 'text-22 leading-tight font-extrabold'}>{m.value}</span>
            {m.chip && <span className="self-start"><Badge tone={m.tone}>{m.chip}</Badge></span>}
          </div>
        ))}
      </div>
    </Card>
  )
}

export function ChangeHistory({ events }: { events: EngineEvent[] }) {
  return (
    <Card className="gap-4">
      <CardHeader title="Change history & approvals" />
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {events.length === 0 && <li className="text-12 text-ink-muted">No changes recorded yet.</li>}
        {events.map((e) => (
          <li key={e.id} className="flex gap-3">
            <span className="mt-1.5 size-2 flex-none rounded-full" style={{ background: DOT[e.tone] }} />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-13 font-bold">{e.title}</span>
              <span className="text-11 text-ink-muted">{fmtDate(e.at)}{e.detail ? ` · ${e.detail}` : ''}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
