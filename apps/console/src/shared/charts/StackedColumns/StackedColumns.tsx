import { cn } from '../../lib/cn'
import { formatCompact, formatNumber } from '../../lib/format'
import { Tooltip, TooltipBody } from '../../ui/Tooltip'

export interface StackSegment {
  value: number
  color: string
  name?: string
}

export interface StackedColumn {
  label: string
  segments: StackSegment[]
  active?: boolean
  /** Tooltip heading; defaults to `label`. */
  tooltipTitle?: string
}

interface StackedColumnsProps {
  columns: StackedColumn[]
  height: number
  gap?: number
  showAxis?: boolean
  formatTick?: (value: number) => string
  /** Formats values inside the tooltip. */
  formatValue?: (value: number) => string
}

function niceMax(value: number): number {
  if (value <= 0) return 4
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = magnitude / 2
  return Math.ceil(value / step) * step
}

/** Stacked vertical bars. Segments are listed bottom → top. Hover shows every segment + the total. */
export function StackedColumns({ columns, height, gap = 8, showAxis = true, formatTick = formatCompact, formatValue = formatNumber }: StackedColumnsProps) {
  const totals = columns.map((c) => c.segments.reduce((sum, s) => sum + s.value, 0))
  const max = niceMax(Math.max(0, ...totals))
  const ticks = [4, 3, 2, 1, 0].map((n) => Math.round((max / 4) * n))

  return (
    <div className="flex w-full gap-3" style={{ height }}>
      {showAxis && (
        <div className="flex w-8 flex-none flex-col justify-between pb-5 text-11 font-medium text-ink-faint">
          {ticks.map((tick) => (
            <span key={tick}>{formatTick(tick)}</span>
          ))}
        </div>
      )}
      <div className="flex min-w-0 flex-1 items-stretch" style={{ gap }}>
        {columns.map((column, index) => {
          const total = totals[index] ?? 0
          const pct = (total / max) * 100
          const align = index === 0 ? 'start' : index === columns.length - 1 ? 'end' : 'center'
          const rows = [
            ...[...column.segments].reverse().map((s) => ({ label: s.name ?? '', value: formatValue(s.value), color: s.color })),
            ...(column.segments.length > 1 ? [{ label: 'Total', value: formatValue(total) }] : []),
          ]
          return (
            <div key={index} className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Tooltip
                className="flex flex-1 items-end"
                align={align}
                style={{ bottom: `calc(${pct}% + 6px)` }}
                content={<TooltipBody title={column.tooltipTitle ?? column.label} rows={rows} />}
              >
                <span className="flex w-full flex-col gap-px transition-opacity group-hover:opacity-80" style={{ height: `${pct}%` }}>
                  {[...column.segments].reverse().map((segment, i, all) =>
                    segment.value > 0 ? (
                      <span
                        key={i}
                        className="min-h-px basis-0"
                        style={{
                          flexGrow: segment.value,
                          background: segment.color,
                          borderRadius: i === 0 ? '3px 3px 0 0' : i === all.length - 1 ? '0 0 2px 2px' : 0,
                        }}
                      />
                    ) : null,
                  )}
                </span>
              </Tooltip>
              <span className={cn('h-3.5 text-center text-10 leading-3.5 font-semibold whitespace-nowrap', column.active ? 'font-bold text-ink' : 'text-ink-faint')}>
                {column.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
