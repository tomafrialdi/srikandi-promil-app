import { Baby } from '@phosphor-icons/react'
import { Card, CardHeader, IconTile } from '../../../shared/ui'
import { formatNumber, formatPercent, toPercentOf } from '../../../shared/lib/format'
import { JOURNEY_STAGES } from '../config/journey-stages'
import type { Journey, Outcomes } from '../types'
import styles from './JourneyCard.module.css'

interface JourneyCardProps {
  journey: Journey
  outcomes: Outcomes
}

export function JourneyCard({ journey, outcomes }: JourneyCardProps) {
  const growth =
    outcomes.conceived_prev_month > 0
      ? Math.round((100 * (outcomes.conceived_this_month - outcomes.conceived_prev_month)) / outcomes.conceived_prev_month)
      : null

  return (
    <Card>
      <CardHeader
        title="User status & outcomes"
        subtitle={`Where ${formatNumber(journey.total)} users are in their journey right now`}
      />

      <div className={styles.stackedBar} role="img" aria-label="Users by journey stage">
        {journey.stages.map(({ stage, count }) => (
          <div
            key={stage}
            className={styles.segment}
            style={{ flexGrow: count, background: JOURNEY_STAGES[stage].color }}
            title={`${JOURNEY_STAGES[stage].label}: ${formatNumber(count)}`}
          />
        ))}
      </div>

      <div className={styles.stages}>
        {journey.stages.map(({ stage, count }) => {
          const meta = JOURNEY_STAGES[stage]
          const StageIcon = meta.icon
          return (
            <div key={stage} className={styles.stage}>
              <div className={styles.stageHead}>
                <IconTile background={meta.tint} size={28}>
                  <StageIcon size={14} color={stage === 'inactive' ? 'var(--ink-muted)' : meta.color} />
                </IconTile>
                <span className={styles.stagePct}>{formatPercent(toPercentOf(count, journey.total), 0)}</span>
              </div>
              <span className={styles.stageCount}>{formatNumber(count)}</span>
              <span className={styles.stageLabel}>{meta.label}</span>
              <span className={styles.stageDesc}>{meta.description}</span>
            </div>
          )
        })}
      </div>

      <div className={styles.outcomes}>
        <div className={styles.conceived}>
          <IconTile background="var(--success)" size={44} round>
            <Baby size={22} color="#fff" />
          </IconTile>
          <div className={styles.conceivedText}>
            <span className={styles.conceivedLabel}>Successfully pregnant (all time)</span>
            <span className={styles.conceivedValue}>{formatNumber(outcomes.conceived_total)}</span>
            <span className={styles.conceivedSub}>
              {formatNumber(outcomes.conceived_this_month)} this month
              {growth != null && ` · ${growth >= 0 ? '↑' : '↓'} ${Math.abs(growth)}%`}
            </span>
          </div>
        </div>
        <OutcomeTile
          label="Conceived within 6 tracked cycles"
          value={formatPercent(outcomes.conceived_within_6_cycles_pct)}
          hint="of all conceptions"
        />
        <OutcomeTile
          label="Avg. cycles to conceive"
          value={outcomes.avg_cycles_to_conceive?.toString() ?? '—'}
          hint={`median ${outcomes.median_cycles_to_conceive ?? '—'}`}
        />
        <OutcomeTile
          label="Referred to specialist"
          value={formatNumber(outcomes.referred_to_specialist)}
          hint="12+ months trying (6+ if ≥ 35 y.o.)"
        />
      </div>
    </Card>
  )
}

function OutcomeTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className={styles.outcomeTile}>
      <span className={styles.outcomeLabel}>{label}</span>
      <span className={styles.outcomeValue}>{value}</span>
      <span className={styles.outcomeHint}>{hint}</span>
    </div>
  )
}
