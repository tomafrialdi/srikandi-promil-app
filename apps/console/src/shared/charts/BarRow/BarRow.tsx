import type { CSSProperties, ReactNode } from 'react'
import { ProgressBar } from '../../ui/ProgressBar'

interface BarRowProps {
  label: ReactNode
  /** 0–100 */
  value: number
  color?: string
  /** Text right of the bar. */
  valueLabel?: ReactNode
  /** Extra trailing cell (e.g. CAC). */
  extra?: ReactNode
  labelWidth?: number
  valueWidth?: number
  extraWidth?: number
  barHeight?: number
  radius?: number
}

/** `label ▬▬▬▬▬ value  extra` – the workhorse of the analytics cards. */
export function BarRow({ label, value, color, valueLabel, extra, labelWidth = 130, valueWidth = 44, extraWidth = 74, barHeight = 10, radius = 3 }: BarRowProps) {
  const cell = (width: number): CSSProperties => ({ width })
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex flex-none items-center gap-2 overflow-hidden text-12 font-semibold text-ellipsis whitespace-nowrap" style={cell(labelWidth)}>
        {label}
      </span>
      <span className="min-w-0 flex-1">
        <ProgressBar value={value} color={color} height={barHeight} radius={radius} />
      </span>
      {valueLabel != null && (
        <span className="flex-none text-right text-12 font-bold" style={cell(valueWidth)}>
          {valueLabel}
        </span>
      )}
      {extra != null && (
        <span className="flex-none text-right text-11 font-medium text-ink-muted" style={cell(extraWidth)}>
          {extra}
        </span>
      )}
    </div>
  )
}
