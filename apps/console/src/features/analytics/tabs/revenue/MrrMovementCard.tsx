import { cn } from '../../../../shared/lib/cn'
import { Badge, Card, CardHeader } from '../../../../shared/ui'
import { formatIdrCompact, formatIdrSigned } from '../../../../shared/lib/format'
import type { RevenueData } from '../../types'

interface Step {
  key: string
  label: string
  /** 'total' bars run from the axis; 'delta' bars float between running totals. */
  kind: 'total' | 'delta'
  amount: number
  from: number
  to: number
}

function buildSteps(m: RevenueData['mrr_movement']): Step[] {
  const deltas: Array<[string, string, number]> = [
    ['new', 'New subscriptions', m.new],
    ['upgrades', 'Upgrades', m.upgrades],
    ['reactivations', 'Reactivations', m.reactivations],
    ['downgrades', 'Downgrades', m.downgrades],
    ['churn', 'Churn', m.churn],
  ]
  let running = m.start
  const steps: Step[] = [{ key: 'start', label: 'Start MRR', kind: 'total', amount: m.start, from: 0, to: m.start }]
  for (const [key, label, amount] of deltas) {
    steps.push({ key, label, kind: 'delta', amount, from: running, to: running + amount })
    running += amount
  }
  steps.push({ key: 'end', label: 'End MRR', kind: 'total', amount: m.end, from: 0, to: m.end })
  return steps
}

export function MrrMovementCard({ data }: { data: RevenueData['mrr_movement'] }) {
  const steps = buildSteps(data)
  const points = steps.flatMap((s) => [s.from, s.to]).filter((v) => v > 0)
  const high = Math.max(...points, 1)
  // Start the axis a little below the lowest running total so small movements stay visible.
  const low = Math.min(...points, high) * 0.85
  const pos = (v: number) => ((Math.max(v, low) - low) / (high - low || 1)) * 100
  const net = data.end - data.start

  return (
    <Card className="min-w-0 flex-1">
      <CardHeader
        title="MRR movement"
        subtitle="What changed in the selected range"
        action={<Badge tone={net >= 0 ? 'success' : 'warning'}>{`Net ${formatIdrSigned(net)}`}</Badge>}
      />
      <div className="flex flex-col gap-1.5">
        {steps.map((step) => {
          const left = step.kind === 'total' ? 0 : pos(Math.min(step.from, step.to))
          const right = pos(Math.max(step.from, step.to))
          const color =
            step.kind === 'total' ? 'var(--secondary)' : step.amount >= 0 ? 'var(--success)' : 'var(--error)'
          return (
            <div key={step.key} className={cn('flex items-center gap-3 rounded-lg px-2.5 py-1.5', step.kind === 'total' && 'bg-surface')}>
              <span className="w-47.5 flex-none text-12 font-semibold">{step.label}</span>
              <span className="relative h-3 min-w-0 flex-1">
                <span
                  className="absolute inset-y-0 rounded-[3px]"
                  style={{ left: `${left}%`, width: `${Math.max(right - left, 0.8)}%`, background: color }}
                />
              </span>
              <span className="w-24 flex-none text-right text-12 font-bold">
                {step.kind === 'total' ? formatIdrCompact(step.amount) : formatIdrSigned(step.amount)}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
