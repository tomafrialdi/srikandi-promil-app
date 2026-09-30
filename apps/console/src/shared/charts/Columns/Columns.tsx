import { cn } from '../../lib/cn'
import { Tooltip, TooltipBody } from '../../ui/Tooltip'

export interface ColumnItem {
  /** Axis label (empty string hides it but keeps the spacing). */
  label: string
  value: number
  color: string
  /** Text above the bar. */
  valueLabel?: string
  /** Emphasise label + value (e.g. "today"). */
  active?: boolean
  /** Tooltip heading; defaults to `label`. */
  tooltipTitle?: string
  /** Tooltip value; defaults to `valueLabel` or the raw value. */
  tooltipValue?: string
  /** Tooltip row label (series name). */
  seriesName?: string
}

interface ColumnsProps {
  items: ColumnItem[]
  height: number
  gap?: number
  /** Round the top corners by this many px. */
  radius?: number
}

/** Single-series vertical bars with optional value labels, axis labels and a hover tooltip. */
export function Columns({ items, height, gap = 8, radius = 4 }: ColumnsProps) {
  const max = Math.max(1, ...items.map((item) => item.value))
  return (
    <div className="flex w-full items-stretch" style={{ height, gap }}>
      {items.map((item, index) => {
        const pct = (item.value / max) * 100
        const align = index === 0 ? 'start' : index === items.length - 1 ? 'end' : 'center'
        return (
          <div key={index} className="flex min-w-0 flex-1 flex-col gap-1.5">
            {item.valueLabel != null && (
              <span className={cn('h-3.5 text-center text-10 leading-3.5 font-semibold whitespace-nowrap', item.active ? 'font-bold text-ink' : 'text-ink-muted')}>
                {item.valueLabel}
              </span>
            )}
            <Tooltip
              className="flex flex-1 items-end"
              align={align}
              style={{ bottom: `calc(${pct}% + 6px)` }}
              content={
                <TooltipBody
                  title={item.tooltipTitle ?? item.label}
                  rows={[{ label: item.seriesName ?? '', value: item.tooltipValue ?? item.valueLabel ?? String(item.value), color: item.color }]}
                />
              }
            >
              <span
                className="block min-h-0.5 w-full transition-opacity group-hover:opacity-80"
                style={{ height: `${pct}%`, background: item.color, borderRadius: `${radius}px ${radius}px 0 0` }}
              />
            </Tooltip>
            <span className={cn('h-3.5 text-center text-10 leading-3.5 font-semibold whitespace-nowrap', item.active ? 'font-bold text-ink' : 'text-ink-faint')}>
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
