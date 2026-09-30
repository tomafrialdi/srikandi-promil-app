import { Card } from '../../../../shared/ui'
import { cn } from '../../../../shared/lib/cn'
import { COLORS } from '../../engine/fields'
import type { SimResult } from '../../engine/simulate'
import { describeSignals } from '../../engine/simulate'
import { versionChip } from '../../lib'
import type { EngineVersion, Signals } from '../../types'

const VERDICT = {
  correct: { label: '✓ Correct', cls: 'bg-success-soft text-success' },
  early: { label: '✕ Early peak', cls: 'bg-error-soft text-error' },
  late: { label: '✕ Late peak', cls: 'bg-error-soft text-error' },
  missed: { label: '✕ Missed', cls: 'bg-warning-soft text-warning-ink' },
  unknown: { label: '', cls: '' },
} as const

interface RunResultProps {
  version: Pick<EngineVersion, 'version' | 'status' | 'rollout_pct'>
  result: SimResult
  signals: Signals
  truthOv?: number
}

export function RunResult({ version, result, signals, truthOv }: RunResultProps) {
  const v = VERDICT[result.verdict]
  const shift = describeSignals(signals).shiftStart
  const message =
    result.verdict === 'early'
      ? `Sent “Peak today” on CD ${result.firstPeak} — ${Math.abs(result.error ?? 0) - 1 > 0 ? `${(truthOv ?? 0) - (result.firstPeak ?? 0) - 1} days early` : 'early'}`
      : result.verdict === 'missed'
        ? 'No Peak status fired — the ovulation was not predicted'
        : result.verdict === 'late'
          ? `Peak arrived on CD ${result.firstPeak} — after ovulation`
          : `Peak on CD ${result.firstPeak}${shift != null ? ` · matches BBT confirm (CD ${shift} − 2)` : ''}`
  const bad = result.verdict !== 'correct' && result.verdict !== 'unknown'

  return (
    <Card className="gap-3.5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-16 font-bold">Rules {version.version}</h2>
          <span className="rounded-full bg-surface-alt px-2 py-0.5 text-10 font-bold text-ink-muted">{versionChip(version).split(' ')[0]}</span>
        </div>
        {v.label && <span className={cn('rounded-full px-2.5 py-1 text-11 font-bold', v.cls)}>{v.label}</span>}
      </header>
      <div className="flex gap-1" role="img" aria-label="Status per cycle day">
        {result.days.map((d) => (
          <span key={d.cd} title={`CD ${d.cd} · ${d.name}`} className="h-6 min-w-0 flex-1 rounded-[4px]" style={{ background: COLORS[d.color].hex, opacity: d.status === 'low_fertility' ? 0.35 : 1 }} />
        ))}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <span className="text-14 font-extrabold">{result.predictedOv != null ? `Ovulation predicted CD ${result.predictedOv}` : 'No ovulation predicted'}</span>
        <span className="text-13 text-ink-muted">Confidence {result.confidence}%</span>
      </div>
      <p className={cn('m-0 text-12 font-medium', bad ? 'text-error' : 'text-success')}>{message}</p>
    </Card>
  )
}
