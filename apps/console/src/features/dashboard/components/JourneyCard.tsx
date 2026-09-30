import { Baby } from '@phosphor-icons/react'
import { cn } from '../../../shared/lib/cn'
import { Card, CardHeader, IconTile, Tooltip, TooltipBody } from '../../../shared/ui'
import { formatNumber, formatPercent, toPercentOf } from '../../../shared/lib/format'
import { JOURNEY_STAGES } from '../config/journey-stages'
import type { Journey, Outcomes } from '../types'

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
      <CardHeader title="User status & outcomes" subtitle={`Where ${formatNumber(journey.total)} users are in their journey right now`} />

      <div className="flex h-3.5 gap-0.5 rounded-full" role="img" aria-label="Users by journey stage">
        {journey.stages.map(({ stage, count }, index) => (
          <div key={stage} className="min-w-0.5 basis-0" style={{ flexGrow: count }}>
            <Tooltip
              className="block"
              align={index === 0 ? 'start' : index === journey.stages.length - 1 ? 'end' : 'center'}
              content={
                <TooltipBody
                  title={JOURNEY_STAGES[stage].label}
                  rows={[{ label: '', value: `${formatNumber(count)} · ${formatPercent(toPercentOf(count, journey.total), 1)}`, color: JOURNEY_STAGES[stage].color }]}
                />
              }
            >
              <span
                className={cn('block h-3.5 w-full', index === 0 && 'rounded-l-full', index === journey.stages.length - 1 && 'rounded-r-full')}
                style={{ background: JOURNEY_STAGES[stage].color }}
              />
            </Tooltip>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5 min-[701px]:grid-cols-4 min-[1281px]:grid-cols-7">
        {journey.stages.map(({ stage, count }) => {
          const meta = JOURNEY_STAGES[stage]
          const StageIcon = meta.icon
          return (
            <div key={stage} className="flex flex-col gap-2 rounded-xl bg-surface px-3.5 py-3">
              <div className="flex items-center justify-between">
                <IconTile background={meta.tint} size={28}>
                  <StageIcon size={14} color={stage === 'inactive' ? 'var(--ink-muted)' : meta.color} />
                </IconTile>
                <span className="text-11 font-bold text-ink-muted">{formatPercent(toPercentOf(count, journey.total), 0)}</span>
              </div>
              <span className="text-20 font-extrabold">{formatNumber(count)}</span>
              <span className="text-12 font-bold">{meta.label}</span>
              <span className="text-11 text-ink-muted">{meta.description}</span>
            </div>
          )
        })}
      </div>

      <div className="grid gap-3 min-[701px]:grid-cols-2 min-[1281px]:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
        <div className="flex items-center gap-3.5 rounded-xl bg-success-soft px-4 py-3">
          <IconTile background="var(--success)" size={44} round>
            <Baby size={22} color="#fff" />
          </IconTile>
          <div className="flex flex-col gap-0.5">
            <span className="text-12 font-bold text-success">Successfully pregnant (all time)</span>
            <span className="text-26 font-extrabold">{formatNumber(outcomes.conceived_total)}</span>
            <span className="text-12 font-semibold text-success">
              {formatNumber(outcomes.conceived_this_month)} this month
              {growth != null && ` · ${growth >= 0 ? '↑' : '↓'} ${Math.abs(growth)}%`}
            </span>
          </div>
        </div>
        <OutcomeTile label="Conceived within 6 tracked cycles" value={formatPercent(outcomes.conceived_within_6_cycles_pct)} hint="of all conceptions" />
        <OutcomeTile label="Avg. cycles to conceive" value={outcomes.avg_cycles_to_conceive?.toString() ?? '—'} hint={`median ${outcomes.median_cycles_to_conceive ?? '—'}`} />
        <OutcomeTile label="Referred to specialist" value={formatNumber(outcomes.referred_to_specialist)} hint="12+ months trying (6+ if ≥ 35 y.o.)" />
      </div>
    </Card>
  )
}

function OutcomeTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className={cn('flex flex-col gap-0.5 rounded-xl bg-surface px-4 py-3')}>
      <span className="text-12 font-semibold text-ink-muted">{label}</span>
      <span className="text-22 font-extrabold">{value}</span>
      <span className="text-11 text-ink-faint">{hint}</span>
    </div>
  )
}
