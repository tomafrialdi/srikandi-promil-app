import { Warning } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Badge, Card, ProgressBar } from '../../../../shared/ui'
import { formatNumber } from '../../../../shared/lib/format'
import { FAILURE_LABEL } from '../../config/labels'
import type { FailureReason, FailureSummary } from '../../types'

/** One colour per failure reason, like the design (strongest → faintest). */
const REASON_COLOR: Record<FailureReason, string> = {
  expired_apns_token: 'var(--error)',
  app_uninstalled: '#e07a9b',
  fcm_throttled: '#e0a030',
  invalid_deep_link: 'var(--ink-faint)',
}

export function FailuresCard({ data }: { data?: FailureSummary }) {
  return (
    <Card className="gap-3.5 min-[1201px]:w-105 min-[1201px]:flex-none">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-15 font-bold">Failed deliveries</h2>
        {data && <Badge tone="error">{formatNumber(data.total)} · 30d</Badge>}
      </header>
      {data && data.reasons.length === 0 && <p className="py-3 text-13 text-ink-muted">No failed deliveries in the last 30 days.</p>}
      {(data?.reasons ?? []).map((r) => (
        <div key={r.reason} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-12">
            <span className="font-semibold">{FAILURE_LABEL[r.reason]}</span>
            <span className="font-bold text-ink-muted">{r.pct}%</span>
          </div>
          <ProgressBar value={r.pct} color={REASON_COLOR[r.reason]} height={8} radius={100} />
        </div>
      ))}
      {data?.worst && (
        <div className="flex items-start gap-2.5 rounded-[10px] bg-error-soft px-3.5 py-3 text-12 leading-snug font-semibold text-error" role="alert">
          <Warning size={15} className="mt-px flex-none" />
          <p className="m-0">
            “{data.worst.name}” failed: {data.worst.pct}% {FAILURE_LABEL[data.worst.reason].toLowerCase()}.{' '}
            <Link to={`/notifications/${data.worst.id}`} className="font-extrabold underline">Fix &amp; resend?</Link>
          </p>
        </div>
      )}
    </Card>
  )
}
