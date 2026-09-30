import { ClockCounterClockwise, Flask, RocketLaunch } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Button } from '../../../shared/ui'
import { releaseAction } from '../lib'
import type { EngineState } from '../types'

interface EngineHeaderProps {
  state?: EngineState
  onHistory: () => void
  onRelease: () => void
}

export function EngineHeader({ state, onHistory, onRelease }: EngineHeaderProps) {
  const action = state ? releaseAction(state) : null
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-26 font-extrabold">Fertility engine</h1>
        <p className="text-14 text-ink-muted">How daily signals become a fertility status. Changes require medical sign-off.</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button variant="outline" onClick={onHistory} leadingIcon={<ClockCounterClockwise size={16} />}>Version history</Button>
        <Link to="/fertility-engine/simulator" className="inline-flex items-center justify-center gap-2 rounded-control border border-border bg-card px-3.5 py-[9px] text-13 font-bold whitespace-nowrap">
          <Flask size={16} /> Open simulator
        </Link>
        {action && (
          <Button onClick={onRelease} disabled={!action.enabled} leadingIcon={<RocketLaunch size={16} color="#fff" />}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}
