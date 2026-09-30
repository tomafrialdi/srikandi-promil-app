import { EyeSlash, Heart, Sparkle, TestTube, Thermometer, Waves, Smiley, type Icon } from '@phosphor-icons/react'
import { cn } from '../../../../shared/lib/cn'
import { Card, CardHeader, Tooltip, TooltipBody } from '../../../../shared/ui'
import { Legend } from '../../../../shared/charts'
import type { UserDetail } from '../../types'

const COLORS = { period: '#d64545', follicular: '#e7e4dc', fertile: '#f6dee6', peak: '#c13d68', afterPeak: '#e07a9b', luteal: '#dceaf9' }

const LEGEND = [
  { label: 'Period', color: COLORS.period },
  { label: 'Fertile', color: COLORS.fertile },
  { label: 'Peak', color: COLORS.peak },
  { label: 'Luteal (predicted)', color: COLORS.luteal },
]

const SIGNAL_ICON: Record<string, Icon> = { bbt: Thermometer, lh: TestTube, cf: Waves, checkin: Smiley, intimacy: Heart }

/** Colour of each cycle day: period · follicular · fertile · peak (3 days up to ovulation) · day after · luteal. */
function dayColor(day: number, fertileFrom: number | null, ovulation: number | null, length: number): { color: string; phase: string } {
  const ov = ovulation ?? Math.max(10, length - 14)
  const from = fertileFrom ?? ov - 5
  if (day <= 5) return { color: COLORS.period, phase: 'Period' }
  if (day >= ov - 2 && day <= ov) return { color: COLORS.peak, phase: 'Peak' }
  if (day === ov + 1) return { color: COLORS.afterPeak, phase: 'Post-ovulation' }
  if (day >= from && day < ov - 2) return { color: COLORS.fertile, phase: 'Fertile' }
  if (day > ov + 1) return { color: COLORS.luteal, phase: 'Luteal (predicted)' }
  return { color: COLORS.follicular, phase: 'Follicular' }
}

export function TrackingSummaryCard({ data }: { data: UserDetail['tracking'] }) {
  const length = data.cycle_length
  const days = Array.from({ length }, (_, i) => i + 1)

  return (
    <Card className="gap-4">
      <CardHeader
        title="Tracking summary"
        subtitle={data.cycle_day ? `Current cycle · CD ${data.cycle_day} of ~${length}` : 'No open cycle'}
        action={
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-surface-alt px-2.5 text-11 font-bold text-ink-muted">
            <EyeSlash size={13} />
            Symptoms &amp; notes masked
          </span>
        }
      />

      {data.engine_headline && (
        <div className="flex items-center gap-3 rounded-xl bg-primary-soft px-3.5 py-3.5 text-primary">
          <Sparkle size={20} weight="fill" className="flex-none" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <strong className="text-13 font-bold">Engine status: {data.engine_headline}</strong>
            <span className="text-12 font-medium">{data.engine_detail}</span>
          </div>
        </div>
      )}

      {data.cycle_day && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-[3px]" role="img" aria-label="Cycle days">
            {days.map((day) => {
              const { color, phase } = dayColor(day, data.fertile_from, data.ovulation_day, length)
              return (
                <Tooltip key={day} className="block min-w-0 flex-1" content={<TooltipBody title={`CD ${day}`} rows={[{ label: phase, value: day === data.cycle_day ? 'today' : '' }]} />}>
                  <span className={cn('block h-7 rounded', day === data.cycle_day && 'ring-1 ring-ink')} style={{ background: color }} />
                </Tooltip>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-3.5">
            <Legend items={LEGEND} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 min-[801px]:grid-cols-4">
        {data.signals.map((signal) => {
          const Glyph = SIGNAL_ICON[signal.key] ?? Heart
          return (
            <div key={signal.key} className="flex flex-col gap-1.5 rounded-xl bg-surface p-3.5">
              <span className="flex items-center gap-1.5 text-12 font-semibold text-ink-muted"><Glyph size={14} />{signal.label}</span>
              <span className="text-20 leading-tight font-extrabold">{signal.value}</span>
              <span className="text-11 font-medium text-ink-faint">{signal.hint}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
