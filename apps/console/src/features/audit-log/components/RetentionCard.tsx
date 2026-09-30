import { Card, CardHeader } from '../../../shared/ui'
import { RETENTION } from '../config/retention'
import type { AuditSummary } from '../types'

export function RetentionCard({ summary }: { summary?: AuditSummary }) {
  const chain = summary?.chain
  const rows = [
    ...RETENTION.slice(0, 3),
    { title: 'Hash chain', detail: chain ? `SHA-256 · ${chain.ok ? 'verified' : 'BROKEN'} · ${chain.rows.toLocaleString('en-US')} events` : 'SHA-256 · not verified yet' },
    RETENTION[3]!,
  ]
  return (
    <Card className="gap-3 min-[1101px]:w-[360px] min-[1101px]:flex-none">
      <CardHeader title="Retention & integrity" />
      <dl className="m-0 flex flex-col">
        {rows.map((r) => (
          <div key={r.title} className="flex flex-col gap-0.5 border-b border-border py-2.5 last:border-b-0">
            <dt className="text-13 font-bold">{r.title}</dt>
            <dd className="m-0 text-12 font-medium text-ink-muted">{r.detail}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
