import { Card, CardHeader } from '../../../shared/ui'
import { formatCompact } from '../../../shared/lib/format'
import type { GrowthPoint } from '../types'
import styles from './UserGrowthCard.module.css'

/** Rounds up to a "nice" axis maximum (e.g. 137 -> 150). */
function niceMax(value: number): number {
  if (value <= 0) return 4
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = magnitude / 2
  return Math.ceil(value / step) * step
}

const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })

export function UserGrowthCard({ data }: { data: GrowthPoint[] }) {
  const max = niceMax(Math.max(0, ...data.map((point) => point.free + point.paid)))
  const ticks = [4, 3, 2, 1, 0].map((n) => (max / 4) * n)

  return (
    <Card className={styles.card}>
      <CardHeader
        title="User growth"
        subtitle="New sign-ups per month, free vs paid"
        action={
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.swatch} style={{ background: 'var(--secondary)' }} />
              Free
            </span>
            <span className={styles.legendItem}>
              <span className={styles.swatch} style={{ background: 'var(--primary)' }} />
              Paid
            </span>
          </div>
        }
      />

      <div className={styles.chart}>
        <div className={styles.yAxis}>
          {ticks.map((tick) => (
            <span key={tick}>{formatCompact(Math.round(tick))}</span>
          ))}
        </div>
        <div className={styles.bars}>
          {data.map((point, index) => {
            const total = point.free + point.paid
            const isLast = index === data.length - 1
            return (
              <div key={point.month} className={styles.column} title={`${point.free} free · ${point.paid} paid`}>
                <div className={styles.plot}>
                  <div className={styles.stack} style={{ height: `${(total / max) * 100}%` }}>
                    {point.paid > 0 && <div className={styles.paid} style={{ flexGrow: point.paid }} />}
                    {point.free > 0 && (
                      <div
                        className={styles.free}
                        style={{ flexGrow: point.free, opacity: isLast ? 1 : 0.7 }}
                      />
                    )}
                  </div>
                </div>
                <span className={`${styles.month} ${isLast ? styles.monthActive : ''}`}>
                  {monthFormat.format(new Date(point.month))}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
