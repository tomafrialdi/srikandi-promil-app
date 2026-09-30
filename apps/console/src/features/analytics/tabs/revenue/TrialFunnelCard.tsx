import { Card, CardHeader } from '../../../../shared/ui'
import { formatNumber, formatPercent, toPercentOf } from '../../../../shared/lib/format'
import type { RevenueData } from '../../types'
import styles from './RevenueTab.module.css'

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
    <Card className={styles.grow}>
      <CardHeader title="Trial conversion" subtitle={`${formatNumber(data.started)} trials in the selected range`} />
      <div className={styles.tiles}>
        {steps.map((step) => (
          <div key={step.label} className={styles.tile} style={{ background: step.tint }}>
            <span className={styles.tilePct} style={{ color: step.ink }}>
              {formatPercent(toPercentOf(step.count, data.started), step.label === 'Converted to paid' ? 1 : 0)}
            </span>
            <span className={styles.tileCount}>{formatNumber(step.count)}</span>
            <span className={styles.tileLabel}>{step.label}</span>
          </div>
        ))}
      </div>
      {hasSplit && (
        <p className={styles.note}>
          Trials that log 3 signals in the first 3 days convert at {data.strong_start_convert_pct}% vs{' '}
          {data.weak_start_convert_pct}% for those who don't.
        </p>
      )}
    </Card>
  )
}
