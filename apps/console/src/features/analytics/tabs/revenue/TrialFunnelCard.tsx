import { Card, CardHeader } from '../../../../shared/ui'
import { formatNumber, formatPercent, toPercentOf } from '../../../../shared/lib/format'
import type { RevenueData } from '../../types'

export function TrialFunnelCard({ data }: { data: RevenueData['trial_funnel'] }) {
  const steps = [
    { label: 'Trials started', count: data.started, tint: 'var(--secondary-soft)', ink: 'var(--secondary)' },
    { label: 'Active on day 5', count: data.active_day5, tint: 'var(--surface-alt)', ink: 'var(--ink-muted)' },
    { label: 'Saw paywall reminder', count: data.saw_paywall, tint: 'var(--warning-soft)', ink: 'var(--warning-ink)' },
    { label: 'Converted to paid', count: data.converted, tint: 'var(--success-soft)', ink: 'var(--success)' },
  ]
  const hasSplit =
    data.strong_start_convert_pct != null &&
    data.weak_start_convert_pct != null &&
    data.strong_start_convert_pct > data.weak_start_convert_pct

  return (
    <Card className="min-w-0 flex-1">
      <CardHeader title="Trial conversion" subtitle={`${formatNumber(data.started)} trials in the selected range`} />
      <div className="grid grid-cols-2 gap-2.5 min-[701px]:grid-cols-4">
        {steps.map((step) => (
          <div key={step.label} className="flex flex-col gap-0.5 rounded-xl p-3" style={{ background: step.tint }}>
            <span className="text-11 font-bold" style={{ color: step.ink }}>
              {formatPercent(toPercentOf(step.count, data.started), step.label === 'Converted to paid' ? 1 : 0)}
            </span>
            <span className="text-20 font-extrabold">{formatNumber(step.count)}</span>
            <span className="text-12 font-semibold text-ink-muted">{step.label}</span>
          </div>
        ))}
      </div>
      {hasSplit && (
        <p className="text-12 text-ink-muted">
          Trials that log 3 signals in the first 3 days convert at {data.strong_start_convert_pct}% vs{' '}
          {data.weak_start_convert_pct}% for those who don't.
        </p>
      )}
    </Card>
  )
}
