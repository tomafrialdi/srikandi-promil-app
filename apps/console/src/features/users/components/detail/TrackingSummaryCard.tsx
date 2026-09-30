import { Card, CardHeader } from '../../../../shared/ui'
import { Legend } from '../../../../shared/charts'
import type { UserDetail } from '../../types'
import styles from './UserDetail.module.css'

const COLORS = { period: '#c13d68', follicular: '#e7e4dc', fertile: '#8fd19b', peak: '#3f9950', luteal: '#dceaf9' }

const LEGEND = [
  { label: 'Period', color: COLORS.period },
  { label: 'Fertile', color: COLORS.fertile },
  { label: 'Peak', color: COLORS.peak },
  { label: 'Luteal (predicted)', color: COLORS.luteal },
]

/** Segments (in days) of one cycle: period · follicular · fertile · peak · luteal. */
function segments(length: number, fertileFrom: number | null, ovulation: number | null) {
  const ov = ovulation ?? Math.max(10, length - 14)
  const from = fertileFrom ?? ov - 5
  return [
    { key: 'period', days: 5, color: COLORS.period },
    { key: 'follicular', days: Math.max(0, from - 1 - 5), color: COLORS.follicular },
    { key: 'fertile', days: Math.max(0, ov - from), color: COLORS.fertile },
    { key: 'peak', days: 1, color: COLORS.peak },
    { key: 'luteal', days: Math.max(0, length - ov), color: COLORS.luteal },
  ]
}

export function TrackingSummaryCard({ data }: { data: UserDetail['tracking'] }) {
  const length = data.cycle_length
  const parts = segments(length, data.fertile_from, data.ovulation_day)
  const total = parts.reduce((sum, p) => sum + p.days, 0) || 1

  return (
    <Card>
      <CardHeader
        title="Tracking summary"
        subtitle={data.cycle_day ? `Current cycle · CD ${data.cycle_day} of ~${length}` : 'No open cycle'}
        action={<span className={styles.itemLine}>Symptoms & notes masked</span>}
      />

      {data.engine_headline && (
        <div className={styles.engineBox}>
          <strong>Engine status: {data.engine_headline}</strong>
          <span>{data.engine_detail}</span>
        </div>
      )}

      {data.cycle_day && (
        <div className={styles.strip}>
          <div className={styles.stripBar}>
            {parts.map((part) => (
              <span key={part.key} className={styles.stripSegment} style={{ width: `${(part.days / total) * 100}%`, background: part.color }} />
            ))}
            <span className={styles.stripMarker} style={{ left: `${Math.min(100, (data.cycle_day / total) * 100)}%` }} title={`Today · CD ${data.cycle_day}`} />
          </div>
          <div className={styles.stripLegend}>
            <Legend items={LEGEND} />
          </div>
        </div>
      )}

      <div className={styles.signals}>
        {data.signals.map((signal) => (
          <div key={signal.key} className={styles.signal}>
            <span className={styles.signalLabel}>{signal.label}</span>
            <span className={styles.signalValue}>{signal.value}</span>
            <span className={styles.signalHint}>{signal.hint}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
