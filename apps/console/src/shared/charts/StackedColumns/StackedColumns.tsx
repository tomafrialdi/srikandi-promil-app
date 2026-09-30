import { formatCompact } from '../../lib/format'
import styles from './StackedColumns.module.css'

export interface StackSegment {
  value: number
  color: string
  name?: string
}

export interface StackedColumn {
  label: string
  segments: StackSegment[]
  active?: boolean
}

interface StackedColumnsProps {
  columns: StackedColumn[]
  height: number
  gap?: number
  showAxis?: boolean
  formatTick?: (value: number) => string
}

function niceMax(value: number): number {
  if (value <= 0) return 4
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = magnitude / 2
  return Math.ceil(value / step) * step
}

/** Stacked vertical bars. Segments are listed bottom → top. */
export function StackedColumns({ columns, height, gap = 8, showAxis = true, formatTick = formatCompact }: StackedColumnsProps) {
  const totals = columns.map((c) => c.segments.reduce((sum, s) => sum + s.value, 0))
  const max = niceMax(Math.max(0, ...totals))
  const ticks = [4, 3, 2, 1, 0].map((n) => Math.round((max / 4) * n))

  return (
    <div className={styles.chart} style={{ height }}>
      {showAxis && (
        <div className={styles.axis}>
          {ticks.map((tick) => (
            <span key={tick}>{formatTick(tick)}</span>
          ))}
        </div>
      )}
      <div className={styles.columns} style={{ gap }}>
        {columns.map((column, index) => {
          const total = totals[index] ?? 0
          const title = column.segments.map((s) => `${s.name ?? ''} ${s.value}`.trim()).join(' · ')
          return (
            <div key={index} className={styles.column} title={title}>
              <div className={styles.plot}>
                <div className={styles.stack} style={{ height: `${(total / max) * 100}%` }}>
                  {[...column.segments].reverse().map((segment, i, all) =>
                    segment.value > 0 ? (
                      <div
                        key={i}
                        className={styles.segment}
                        style={{
                          flexGrow: segment.value,
                          background: segment.color,
                          borderRadius: i === 0 ? '3px 3px 0 0' : i === all.length - 1 ? '0 0 2px 2px' : 0,
                        }}
                      />
                    ) : null,
                  )}
                </div>
              </div>
              <span className={`${styles.label} ${column.active ? styles.active : ''}`}>{column.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
