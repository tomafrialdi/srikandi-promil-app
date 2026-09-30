import { Card, CardHeader } from '../../../../shared/ui'
import { Legend } from '../../../../shared/charts'
import type { UserDetail } from '../../types'

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
        action={<span className="text-11 text-ink-muted">Symptoms & notes masked</span>}
      />

      {data.engine_headline && (
        <div className="flex flex-col gap-1 rounded-xl bg-primary-soft px-3.5 py-3 [&_strong]:text-13 [&_span]:text-12 [&_span]:text-ink-muted">
          <strong>Engine status: {data.engine_headline}</strong>
          <span>{data.engine_detail}</span>
        </div>
      )}

      {data.cycle_day && (
        <div className="flex flex-col gap-2">
          <div className="relative flex h-3.5 gap-0.5 overflow-hidden rounded-full">
            {parts.map((part) => (
              <span key={part.key} className="h-full" style={{ width: `${(part.days / total) * 100}%`, background: part.color }} />
            ))}
            <span className="absolute inset-y-0 -ml-px w-[3px] rounded-sm bg-ink" style={{ left: `${Math.min(100, (data.cycle_day / total) * 100)}%` }} title={`Today · CD ${data.cycle_day}`} />
          </div>
          <div className="flex flex-wrap gap-3.5">
            <Legend items={LEGEND} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 min-[801px]:grid-cols-4">
        {data.signals.map((signal) => (
          <div key={signal.key} className="flex flex-col gap-0.5 rounded-xl bg-surface p-3">
            <span className="text-12 text-ink-muted">{signal.label}</span>
            <span className="text-20 font-extrabold">{signal.value}</span>
            <span className="text-11 text-ink-faint">{signal.hint}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
