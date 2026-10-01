import { ArrowCounterClockwise, TrendUp } from '@phosphor-icons/react'
import { Badge, Button, Card, CardHeader } from '../../../../shared/ui'
import { daysSince } from '../../lib'
import type { EngineState, Metric } from '../../types'

interface CanaryMonitorProps {
  state: EngineState
  onRollback: () => void
  onExpand: () => void
}

export function CanaryMonitor({ state, onRollback, onExpand }: CanaryMonitorProps) {
  const canary = state.versions.find((v) => v.status === 'canary')
  const metrics: Metric[] = state.metrics.canary ?? []
  const approved = state.approvals.filter((a) => a.decision === 'approved').length
  return (
    <Card className="gap-3">
      <CardHeader title="Canary monitoring" subtitle={canary ? `${canary.version} · ${canary.rollout_pct}% users · day ${daysSince(canary.canary_at) + 1} of ${state.canary_window_days}` : 'No canary is running'} />
      {canary ? (
        <>
          <ul className="m-0 flex list-none flex-col p-0">
            {metrics.map((m) => (
              <li key={m.key} className="flex min-h-[47px] items-center justify-between gap-3 border-t border-border py-2">
                <span className="flex min-w-0 flex-col">
                  <span className="text-13 font-semibold">{m.label}</span>
                  {m.sub && <span className="text-11 font-medium text-ink-faint">{m.sub}</span>}
                </span>
                <Badge tone={m.tone}>{m.value}</Badge>
              </li>
            ))}
          </ul>
          {state.me.can_release && (
            <div className="flex flex-wrap gap-2.5 pt-1">
              <Button variant="outline" onClick={onRollback} leadingIcon={<ArrowCounterClockwise size={16} />}>Roll back</Button>
              {canary.rollout_pct === 5 && (
                <Button onClick={onExpand} disabled={approved < 1} title={approved < 1 ? 'Needs at least one medical approval' : undefined} leadingIcon={<TrendUp size={16} color="#fff" />}>Expand to 25%</Button>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="m-0 text-13 text-ink-muted">Start a canary from the Fertility engine page once a draft has its first medical approval.</p>
      )}
    </Card>
  )
}
