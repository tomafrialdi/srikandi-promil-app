import { Badge, Card, CardHeader } from '../../../shared/ui'
import { formatPercent, toPercentOf } from '../../../shared/lib/format'
import type { AgeDistribution } from '../types'
import styles from './AgeCard.module.css'

const BUCKET_COLOR: Record<string, string> = {
  '< 25': 'rgba(193, 61, 104, 0.5)',
  '25–29': 'rgba(193, 61, 104, 0.5)',
  '30–34': 'var(--primary)',
  '35–39': 'var(--warning)',
  '40+': 'var(--warning)',
}

export function AgeCard({ data }: { data: AgeDistribution }) {
  const buckets = data.buckets ?? []
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0)
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count))
  const older = buckets.filter((b) => b.label === '35–39' || b.label === '40+').reduce((sum, b) => sum + b.count, 0)

  return (
    <Card className={styles.card}>
      <CardHeader
        title="Age distribution"
        subtitle={`Active users · median ${data.median_age ?? '—'} y.o.`}
        action={<Badge tone="warning">{`35+ · ${formatPercent(toPercentOf(older, total), 0)}`}</Badge>}
      />

      <div className={styles.chart}>
        {buckets.map((bucket) => {
          const pct = toPercentOf(bucket.count, total)
          return (
            <div key={bucket.label} className={styles.column}>
              <span className={`${styles.pct} ${bucket.label === '30–34' ? styles.pctActive : ''}`}>
                {formatPercent(pct)}
              </span>
              <div className={styles.plot}>
                <div
                  className={styles.bar}
                  style={{ height: `${(bucket.count / max) * 100}%`, background: BUCKET_COLOR[bucket.label] }}
                />
              </div>
              <span className={styles.label}>{bucket.label}</span>
            </div>
          )
        })}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.swatch} style={{ background: 'var(--primary)' }} />
          Core (25–34)
        </span>
        <span className={styles.legendItem}>
          <span className={styles.swatch} style={{ background: 'var(--warning)' }} />
          35+ · earlier specialist referral
        </span>
      </div>
    </Card>
  )
}
