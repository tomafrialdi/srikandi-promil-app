import { Card, CardHeader, ProgressBar } from '../../../../shared/ui'
import { formatNumber, formatPercent, toPercentOf } from '../../../../shared/lib/format'
import type { AcquisitionData } from '../../types'
import styles from './AcquisitionTab.module.css'

export function InstallFunnelCard({ data }: { data: AcquisitionData['funnel'] }) {
  const total = data.steps[0]?.count ?? 0
  return (
    <Card className={styles.side}>
      <CardHeader title="Install → paid funnel" subtitle="Installs in the selected range" />
      {data.steps.map((step, index) => {
        const pct = toPercentOf(step.count, total)
        return (
          <div key={step.key} className={styles.funnelStep}>
            <div className={styles.funnelRow}>
              <span>{step.label}</span>
              <span className={styles.funnelValue}>
                {formatNumber(step.count)} · {formatPercent(pct, pct < 10 ? 1 : 0)}
              </span>
            </div>
            <ProgressBar value={pct} color={index < 4 ? 'var(--secondary)' : 'var(--primary)'} />
          </div>
        )
      })}
    </Card>
  )
}
