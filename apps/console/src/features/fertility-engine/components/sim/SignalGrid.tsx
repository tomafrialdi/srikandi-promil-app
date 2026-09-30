import { Info } from '@phosphor-icons/react'
import { cn } from '../../../../shared/lib/cn'
import { Card } from '../../../../shared/ui'
import { SIM_DAYS, describeSignals } from '../../engine/simulate'
import type { Level, Signals } from '../../types'

const FILL: Record<Level, string> = { 0: 'var(--surface-alt)', 1: '#f6dee6', 2: '#e07a9b', 3: '#c13d68' }
const DAYS = Array.from({ length: SIM_DAYS }, (_, i) => i + 1)

interface SignalGridProps {
  signals: Signals
  onChange: (next: Signals) => void
  note?: string
}

const nextLevel = (l: Level, back: boolean): Level => ((l + (back ? 3 : 1)) % 4) as Level

export function SignalGrid({ signals, onChange, note }: SignalGridProps) {
  const cycle = (row: 'lh' | 'cf', i: number, back: boolean) => onChange({ ...signals, [row]: signals[row].map((l, x) => (x === i ? nextLevel(l, back) : l)) })
  const stepBbt = (i: number, back: boolean) => {
    const v = signals.bbt[i] ?? null
    const next = v == null ? (back ? 36.9 : 36.2) : back ? (v <= 36.0 ? null : Math.round((v - 0.1) * 10) / 10) : v >= 36.9 ? null : Math.round((v + 0.1) * 10) / 10
    onChange({ ...signals, bbt: signals.bbt.map((x, n) => (n === i ? next : x)) })
  }
  const early = signals.bbt.slice(0, 6).filter((v): v is number => v != null)
  const baseline = early.length ? early.reduce((a, b) => a + b, 0) / early.length : null
  const facts = describeSignals(signals)
  const auto = [
    facts.lhRises.length > 1 ? `${facts.lhRises.length} LH rises (CD ${facts.lhRises.join(', CD ')})` : facts.lhRises.length === 1 ? `LH rise on CD ${facts.lhRises[0]}` : 'No LH rise logged',
    facts.shiftStart != null ? `BBT shift confirmed CD ${facts.shiftStart}` : 'no BBT shift',
  ].join(' · ')

  const cell = 'h-8 min-w-0 rounded-md border-0 text-11 font-bold'
  return (
    <Card className="gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-16 font-bold">Signal input</h2>
          <p className="text-12 font-medium text-ink-muted">Click a cell to edit (shift-click goes back) · CD 1–{SIM_DAYS}</p>
        </div>
        <ul className="m-0 flex list-none flex-wrap gap-3.5 p-0 text-11 text-ink-muted" aria-label="Legend">
          {([3, 2, 1, 0] as Level[]).map((l) => (
            <li key={l} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-[3px]" style={{ background: FILL[l], border: l === 0 ? '1px solid var(--border)' : undefined }} />{['No log', 'Low', 'High', 'Peak'][l]}</li>
          ))}
        </ul>
      </header>
      <div className="overflow-x-auto">
        <div className="grid min-w-[760px] items-center gap-x-1 gap-y-1.5" style={{ gridTemplateColumns: `104px repeat(${SIM_DAYS}, minmax(0, 1fr))` }}>
          <span />
          {DAYS.map((d) => <span key={d} className="text-center text-10 font-medium text-ink-faint">{d}</span>)}

          <span className="text-13 font-bold">LH test</span>
          {DAYS.map((d) => {
            const l = signals.lh[d - 1] ?? 0
            return (
              <button key={d} type="button" aria-label={`LH day ${d}`} className={cell} style={{ background: FILL[l], color: '#fff' }} onClick={(e) => cycle('lh', d - 1, e.shiftKey)}>
                {l === 3 && (signals.lh[d - 2] ?? 0) < 3 ? '↑' : ''}
              </button>
            )
          })}

          <span className="text-13 font-bold">Cervical fluid</span>
          {DAYS.map((d) => (
            <button key={d} type="button" aria-label={`Cervical fluid day ${d}`} className={cell} style={{ background: FILL[signals.cf[d - 1] ?? 0] }} onClick={(e) => cycle('cf', d - 1, e.shiftKey)} />
          ))}

          <span className="text-13 font-bold">BBT °C</span>
          {DAYS.map((d) => {
            const v = signals.bbt[d - 1] ?? null
            const up = v != null && baseline != null && v >= baseline + 0.2 - 1e-9
            return (
              <button key={d} type="button" aria-label={`BBT day ${d}`} title={v != null ? `${v.toFixed(1)} °C` : 'No reading'} className={cn(cell, 'font-mono font-semibold', up ? 'bg-secondary-soft text-secondary' : 'bg-surface-alt text-ink-muted')} onClick={(e) => stepBbt(d - 1, e.shiftKey)}>
                {v != null ? `.${String(Math.round(v * 10) % 10)}` : '·'}
              </button>
            )
          })}
        </div>
      </div>
      <p className="m-0 flex items-start gap-2 text-12 text-ink-muted"><Info size={14} className="mt-px flex-none" />{note ? `${note} — ` : ''}{auto}</p>
    </Card>
  )
}
