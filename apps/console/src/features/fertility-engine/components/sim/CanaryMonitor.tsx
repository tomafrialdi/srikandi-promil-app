import { ArrowsOutSimple, ArrowCounterClockwise } from '@phosphor-icons/react'
import { Badge, Button, Card } from '../../../../shared/ui'
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
      <header className="flex flex-col gap-0.5">
        <h2 className="text-16 font-bold">Canary monitoring</h2>
        <p className="text-12 font-medium text-ink-muted">{canary ? `${canary.version} · ${canary.rollout_pct}% users · day ${daysSince(canary.canary_at) + 1} of ${state.canary_window_days}` : 'No canary is running'}</p>
      </header>
      {canary ? (
        <>
          <ul className="m-0 flex list-none flex-col p-0">
            {metrics.map((m) => (
              <li key={m.key} className="flex items-center justify-between gap-3 border-t border-border py-2.5">
                <span className="flex min-w-0 flex-col">
                  <span className="text-13 font-bold">{m.label}</span>
                  {m.sub && <span className="text-11 text-ink-muted">{m.sub}</span>}
                </span>
                <Badge tone={m.tone}>{m.value}</Badge>
              </li>
            ))}
          </ul>
          {state.me.can_release && (
            <div className="flex flex-wrap gap-2.5 pt-1">
              <Button variant="outline" onClick={onRollback} leadingIcon={<ArrowCounterClockwise size={16} />}>Roll back</Button>
              {canary.rollout_pct === 5 && (
                <Button onClick={onExpand} disabled={approved < 1} title={approved < 1 ? 'Needs at least one medical approval' : undefined} leadingIcon={<ArrowsOutSimple size={16} color="#fff" />}>Expand to 25%</Button>
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
