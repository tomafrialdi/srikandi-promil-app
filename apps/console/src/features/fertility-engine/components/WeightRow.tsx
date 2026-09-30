import { CalendarBlank, Buildings, PencilSimpleLine, Thermometer, Waves, Watch, type Icon } from '@phosphor-icons/react'
import { cn } from '../../../shared/lib/cn'
import { SIGNAL_LABEL } from '../engine/fields'
import { fmtWeight } from '../lib'
import type { SignalKey } from '../types'

const ICON: Record<SignalKey, Icon> = {
  lh: PencilSimpleLine,
  cf: Waves,
  bbt: Thermometer,
  calendar: CalendarBlank,
  skin: Watch,
  protocol: Buildings,
}

interface WeightRowProps {
  signal: SignalKey
  value: number
  color: string
  disabled?: boolean
  onChange: (value: number) => void
  /** Default (TTC) value: draws a tick and shows "0.40 → 0.45". */
  baseline?: number
  /** Wide value box instead of the arrow text. */
  boxed?: boolean
  /** Shows "off" instead of 0.00 (signals a mode switches off completely). */
  offAtZero?: boolean
}

/** One signal weight: icon, label, slider, value. The native range input is invisible; the track is drawn around it. */
export function WeightRow({ signal, value, color, disabled, onChange, baseline, boxed, offAtZero }: WeightRowProps) {
  const Glyph = ICON[signal]
  const label = SIGNAL_LABEL[signal]
  const changed = baseline != null && Math.abs(baseline - value) > 0.004
  return (
    <div className={cn('grid items-center gap-3', boxed ? 'grid-cols-[150px_minmax(0,1fr)_56px]' : 'grid-cols-[130px_minmax(0,1fr)_92px]')}>
      <span className="flex items-center gap-2 text-13 font-semibold">
        <Glyph size={15} className="flex-none text-ink-muted" />
        <span className="truncate">{label}</span>
      </span>
      <div className="relative flex h-5 items-center">
        <span className="absolute inset-x-0 h-1.5 rounded-full bg-surface-alt" />
        <span className="absolute left-0 h-1.5 rounded-full" style={{ width: `${value * 100}%`, background: color }} />
        {baseline != null && <span className="absolute h-3.5 w-0.5 rounded-full bg-ink" style={{ left: `${baseline * 100}%` }} />}
        {boxed && (
          <span className="absolute size-3.5 -translate-x-1/2 rounded-full border-2 bg-card" style={{ left: `${value * 100}%`, borderColor: color }} />
        )}
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          disabled={disabled}
          aria-label={`${label} weight`}
          className="absolute inset-0 m-0 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          onChange={(e) => onChange(Math.round(Number(e.target.value) * 100) / 100)}
        />
      </div>
      {boxed ? (
        <span className="rounded-lg border border-border bg-card py-1.5 text-center font-mono text-12 font-semibold">{fmtWeight(value)}</span>
      ) : (
        <span className="text-right font-mono text-12">
          {baseline != null && (
            <>
              <span className="text-ink-faint">{fmtWeight(baseline)}</span>
              <span className="text-ink-faint"> → </span>
            </>
          )}
          <span className={cn('font-bold', changed ? '' : 'text-ink')} style={changed ? { color } : undefined}>
            {offAtZero && value === 0 ? 'off' : fmtWeight(value)}
          </span>
        </span>
      )}
    </div>
  )
}
