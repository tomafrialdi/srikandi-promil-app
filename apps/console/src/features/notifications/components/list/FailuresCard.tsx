import { WarningCircle } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Badge, Card, Notice } from '../../../../shared/ui'
import { BarRow } from '../../../../shared/charts'
import { formatNumber } from '../../../../shared/lib/format'
import { FAILURE_LABEL } from '../../config/labels'
import type { FailureSummary } from '../../types'

export function FailuresCard({ data }: { data?: FailureSummary }) {
  return (
    <Card className="gap-3 min-[1201px]:flex-[2]">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-15 font-bold">Failed deliveries</h2>
        {data && <Badge tone="error">{formatNumber(data.total)} · 30d</Badge>}
      </header>
      {data && data.reasons.length === 0 && <p className="py-3 text-13 text-ink-muted">No failed deliveries in the last 30 days.</p>}
      {(data?.reasons ?? []).map((r) => (
        <BarRow key={r.reason} label={FAILURE_LABEL[r.reason]} labelWidth={140} value={r.pct} color="var(--error)" valueLabel={`${r.pct}%`} />
      ))}
      {data?.worst && (
        <Notice tone="error" icon={<WarningCircle size={16} />}>
          “{data.worst.name}” failed: {data.worst.pct}% {FAILURE_LABEL[data.worst.reason].toLowerCase()}.{' '}
          <Link to={`/notifications/${data.worst.id}`} className="font-extrabold underline">Fix &amp; resend?</Link>
        </Notice>
      )}
    </Card>
  )
}
