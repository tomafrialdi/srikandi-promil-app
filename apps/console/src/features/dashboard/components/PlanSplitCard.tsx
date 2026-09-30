import { Card, CardHeader, DonutChart } from '../../../shared/ui'
import { formatNumber, formatPercent } from '../../../shared/lib/format'
import { PLAN_COLOR, PLAN_LABEL } from '../config/labels'
import type { PlanSplit } from '../types'
import styles from './PlanSplitCard.module.css'

export function PlanSplitCard({ data }: { data: PlanSplit }) {
  return (
    <Card className={styles.card}>
      <CardHeader title="Plan split" subtitle="Active accounts by plan" />

      <div className={styles.row}>
        <DonutChart segments={data.plans.map((p) => ({ value: p.count, color: PLAN_COLOR[p.plan] }))}>
          <span className={styles.donutValue}>{formatPercent(data.paid_pct)}</span>
          <span className={styles.donutLabel}>paid</span>
        </DonutChart>

        <ul className={styles.list}>
          {data.plans.map((p) => (
            <li key={p.plan} className={styles.item}>
              <span className={styles.dot} style={{ background: PLAN_COLOR[p.plan] }} />
              <span className={styles.itemLabel}>{PLAN_LABEL[p.plan]}</span>
              <span className={styles.itemValue}>{formatNumber(p.count)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.conversion}>
        <div className={styles.conversionText}>
          <span className={styles.conversionLabel}>Trial → paid conversion</span>
          <span className={styles.conversionValue}>{formatPercent(data.trial_conversion_pct)}</span>
        </div>
      </div>
    </Card>
  )
}
