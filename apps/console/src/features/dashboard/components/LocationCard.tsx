import { Card, CardHeader, ProgressBar } from '../../../shared/ui'
import { formatNumber, formatPercent, toPercentOf } from '../../../shared/lib/format'
import type { Locations } from '../types'
import styles from './LocationCard.module.css'

export function LocationCard({ data }: { data: Locations }) {
  const rows = [
    ...data.provinces,
    ...(data.others.count > 0
      ? [{ name: `Others (${data.others.provinces} prov.)`, count: data.others.count, muted: true }]
      : []),
  ]

  return (
    <Card className={styles.card}>
      <CardHeader title="Users by location" subtitle="Top provinces · % of active users" />

      <div className={styles.body}>
        <div className={styles.bars}>
          {rows.map((row, index) => {
            const pct = toPercentOf(row.count, data.total)
            const muted = 'muted' in row
            const color = muted ? 'var(--ink-faint)' : index < 3 ? 'var(--primary)' : 'rgba(193, 61, 104, 0.6)'
            return (
              <div key={row.name} className={styles.row}>
                <span className={styles.name}>{row.name}</span>
                <ProgressBar value={pct} color={color} height={12} radius={3} />
                <span className={styles.pct}>{formatPercent(pct)}</span>
                <span className={styles.count}>{formatNumber(row.count)}</span>
              </div>
            )
          })}
        </div>

        <div className={styles.side}>
          <SideStat
            tone="primary"
            label="Java island"
            value={formatPercent(data.java_share_pct)}
            hint="of all users"
          />
          {data.top_city && (
            <SideStat
              tone="secondary"
              label="Top city"
              value={data.top_city.name}
              hint={`${formatNumber(data.top_city.count)} users`}
            />
          )}
          {data.fastest_growing_city && (
            <SideStat
              tone="success"
              label="Fastest growing"
              value={data.fastest_growing_city.name}
              hint={`↑ ${data.fastest_growing_city.growth_pct}% last 30 days`}
            />
          )}
        </div>
      </div>
    </Card>
  )
}

function SideStat({
  tone,
  label,
  value,
  hint,
}: {
  tone: 'primary' | 'secondary' | 'success'
  label: string
  value: string
  hint: string
}) {
  return (
    <div className={`${styles.stat} ${styles[tone]}`}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statHint}>{hint}</span>
    </div>
  )
}
