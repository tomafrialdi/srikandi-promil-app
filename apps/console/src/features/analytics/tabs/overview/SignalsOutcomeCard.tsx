import { Sparkle } from '@phosphor-icons/react'
import { Badge, Card, CardHeader, ProgressBar } from '../../../../shared/ui'
import { formatNumber } from '../../../../shared/lib/format'
import { DEPTH_LABEL } from '../../config/labels'
import type { OverviewData } from '../../types'
import styles from './OverviewTab.module.css'

export function SignalsOutcomeCard({ data }: { data: OverviewData['signals_vs_outcome'] }) {
  const rows = data.rows
  const max = Math.max(1, ...rows.map((r) => r.median_cycles))
  const best = rows[0]
  const worst = rows[rows.length - 1]
  const ratio = best && worst && best.median_cycles > 0 ? worst.median_cycles / best.median_cycles : null

  return (
    <Card className={styles.grow}>
      <CardHeader
        title="What predicts conception?"
        subtitle="Median cycles to pregnancy by tracking behaviour"
        action={<Badge tone="primary">{`n = ${formatNumber(data.sample_size)}`}</Badge>}
      />
      {rows.map((row, index) => (
        <div key={row.depth} className={styles.outcomeRow}>
          <div className={styles.outcomeLabelRow}>
            <span>{DEPTH_LABEL[row.depth]}</span>
            <span className={index === 0 ? styles.outcomeBest : undefined}>{row.median_cycles} cycles</span>
          </div>
          <ProgressBar
            value={(row.median_cycles / max) * 100}
            height={10}
            color={
              row.depth === 'calendar_only' ? 'var(--ink-faint)' : index === 0 ? 'var(--success)' : 'rgba(63, 153, 80, 0.6)'
            }
          />
        </div>
      ))}
      {ratio != null && ratio > 1.1 && (
        <div className={styles.note}>
          <Sparkle size={15} color="var(--success)" />
          <p>Users logging 3 signals conceive ~{Number(ratio.toFixed(1))}× faster than calendar-only users.</p>
        </div>
      )}
    </Card>
  )
}
