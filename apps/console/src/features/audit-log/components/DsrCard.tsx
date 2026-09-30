import { Badge, Card, CardHeader } from '../../../shared/ui'
import { DSR_STATUS, DSR_TYPE } from '../config/labels'
import { dayMonth, daysLeft } from '../lib/format'
import type { PdpList, PdpRequest } from '../types'

function detail(r: PdpRequest): string {
  if (r.status === 'completed') return `Delivered ${r.completed_at ? dayMonth(r.completed_at) : ''}`.trim()
  if (r.status_note) return r.status_note
  const left = daysLeft(r.due_at)
  return left > 30 ? `Due ${dayMonth(r.due_at)}` : left > 0 ? `${left} of 30 days left` : 'Deadline passed'
}

export function DsrCard({ data, onOpen }: { data?: PdpList; onOpen: (id: string) => void }) {
  return (
    <Card className="gap-3 min-[1101px]:flex-1">
      <CardHeader title="Data subject requests (UU PDP)" subtitle="Access · correction · deletion · portability" action={data ? <Badge tone={data.open > 0 ? 'warning' : 'success'}>{data.open} open</Badge> : undefined} />
      <ul className="m-0 flex list-none flex-col p-0">
        {(data?.rows ?? []).map((r) => (
          <li key={r.id} className="border-b border-border last:border-b-0">
            <button type="button" onClick={() => onOpen(r.id)} className="flex w-full items-center gap-3 py-3 text-left hover:bg-surface">
              <span className="w-20 flex-none font-mono text-11 font-bold text-ink-muted">DSR-{String(r.number).padStart(4, '0')}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-13 font-bold">{DSR_TYPE[r.type]}</span>
                <span className="truncate text-11 font-medium text-ink-muted">{r.subject_ref} · {detail(r)}</span>
              </span>
              <Badge tone={DSR_STATUS[r.status].tone}>{DSR_STATUS[r.status].label}</Badge>
            </button>
          </li>
        ))}
        {data && data.rows.length === 0 && <li className="py-6 text-center text-13 text-ink-muted">No requests yet.</li>}
      </ul>
    </Card>
  )
}
