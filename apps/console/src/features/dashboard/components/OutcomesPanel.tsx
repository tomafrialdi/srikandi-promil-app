import { Baby } from '@phosphor-icons/react'
import { formatNumber } from '../../../shared/lib/format'
import type { Outcomes } from '../types'
import styles from './OutcomesPanel.module.css'

export function OutcomesPanel({ data }: { data: Outcomes }) {
  const change =
    data.conceived_prev_month > 0
      ? Math.round((100 * (data.conceived_this_month - data.conceived_prev_month)) / data.conceived_prev_month)
      : null

  return (
    <section className={styles.panel}>
      <header className={styles.head}>
        <Baby size={18} color="#fff" />
        <h2 className={styles.title}>Fertility outcomes</h2>
      </header>

      <Metric
        label="Pregnancies reported (this month)"
        value={formatNumber(data.conceived_this_month)}
        hint={change == null ? 'no data for last month' : `${change >= 0 ? '+' : ''}${change}% vs last month`}
      />
      <Metric
        label="Avg. cycles to conceive"
        value={data.avg_cycles_to_conceive?.toString() ?? '—'}
        hint="users logging ≥3 signals"
      />
      <Metric label="Referred to specialist" value={formatNumber(data.referred_to_specialist)} hint="after 12 months trying" />
    </section>
  )
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className={styles.metric}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      <span className={styles.hint}>{hint}</span>
    </div>
  )
}
