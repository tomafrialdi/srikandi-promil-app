import { Tooltip, TooltipBody } from '../../ui/Tooltip'

export interface LineSeries {
  name: string
  color: string
  /** One entry per x label; null leaves a gap. */
  values: Array<number | null>
  /** Draw thicker / emphasised. */
  emphasis?: boolean
}

interface LineChartProps {
  series: LineSeries[]
  xLabels: string[]
  height: number
  /** Y axis maximum, default 100. */
  max?: number
}

/** Percent line chart (0–max) with 5 gridlines; hovering a point shows every series at that x. */
export function LineChart({ series, xLabels, height, max = 100 }: LineChartProps) {
  const n = xLabels.length
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100)
  const y = (v: number) => 100 - (v / max) * 100
  const ticks = [4, 3, 2, 1, 0].map((k) => Math.round((max / 4) * k))

  return (
    <div className="flex w-full gap-3" style={{ height }}>
      <div className="flex w-[34px] flex-none flex-col justify-between pb-[22px] text-11 font-medium text-ink-faint">
        {ticks.map((t) => (
          <span key={t}>{t}%</span>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="relative mx-2 flex-1">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 left-0 h-px bg-surface-alt" style={{ top: `${y(t)}%` }} />
          ))}
          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {series.map((s) => {
              const points = s.values
                .map((v, i) => (v == null ? null : `${x(i)},${y(v)}`))
                .filter(Boolean)
                .join(' ')
              return (
                <polyline
                  key={s.name}
                  points={points}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.emphasis ? 2.5 : 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
          </svg>
          {xLabels.map((label, i) => {
            const rows = series
              .filter((s) => s.values[i] != null)
              .map((s) => ({ label: s.name, value: `${s.values[i]}%`, color: s.color }))
            const align = i === 0 ? 'start' : i === n - 1 ? 'end' : 'center'
            return (
              <div key={label} className="absolute inset-y-0 w-6 -translate-x-1/2" style={{ left: `${x(i)}%` }}>
                <Tooltip className="block h-full w-full" align={align} placement="top" style={{ bottom: 'calc(100% - 8px)' }} content={<TooltipBody title={label} rows={rows} />}>
                  <span className="absolute inset-y-0 left-1/2 w-px bg-transparent transition-colors group-hover:bg-border" />
                  {series.map((s) =>
                    s.values[i] == null ? null : (
                      <span
                        key={s.name}
                        className="absolute left-1/2 -mt-[3.5px] -ml-[3.5px] size-[7px] rounded-full border-[1.5px] border-card"
                        style={{ top: `${y(s.values[i]!)}%`, background: s.color }}
                      />
                    ),
                  )}
                </Tooltip>
              </div>
            )
          })}
        </div>
        <div className="relative mx-2 h-3.5">
          {xLabels.map((label, i) => (
            <span key={label} className="absolute -translate-x-1/2 text-11 font-semibold text-ink-faint" style={{ left: `${x(i)}%` }}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
