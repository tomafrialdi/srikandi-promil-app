import { Tooltip, TooltipBody } from '../../ui/Tooltip'

interface HeatGridProps {
  rowLabels: string[]
  colLabels: string[]
  /** values[row][col]; rendered relative to the max value. */
  values: number[][]
  /** Cell colour at full intensity. */
  color?: string
  /** Tooltip value text, e.g. (n) => `${n} sessions`. */
  formatValue?: (value: number) => string
}

export function HeatGrid({ rowLabels, colLabels, values, color = 'var(--primary)', formatValue = (n) => String(n) }: HeatGridProps) {
  const max = Math.max(1, ...values.flat())
  return (
    <div className="grid items-center gap-1" style={{ gridTemplateColumns: `36px repeat(${colLabels.length}, minmax(0, 1fr))` }}>
      <span />
      {colLabels.map((label) => (
        <span key={label} className="text-center text-9 font-semibold text-ink-faint">
          {label}
        </span>
      ))}
      {rowLabels.map((rowLabel, r) => (
        <div key={rowLabel} className="contents">
          <span className="text-11 font-semibold text-ink-muted">{rowLabel}</span>
          {colLabels.map((label, c) => {
            const value = values[r]?.[c] ?? 0
            return (
              <Tooltip key={label} className="block" content={<TooltipBody title={`${rowLabel} · ${label}:00`} rows={[{ label: '', value: formatValue(value) }]} />}>
                <span className="block h-[26px] rounded-[5px] transition-transform group-hover:scale-110" style={{ background: color, opacity: 0.08 + (value / max) * 0.92 }} />
              </Tooltip>
            )
          })}
        </div>
      ))}
    </div>
  )
}
