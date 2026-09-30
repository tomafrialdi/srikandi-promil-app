import { Badge, Card, CardHeader } from '../../../../shared/ui'
import { formatNumber, formatPercent } from '../../../../shared/lib/format'
import { RETURN_SOURCE_LABEL } from '../../config/labels'
import { trendBadge } from '../../components/trend-badge'
import type { RetentionData } from '../../types'
import styles from './RetentionTab.module.css'

export function WinBackCard({ data }: { data: RetentionData['win_back'] }) {
  const change =
    data.resurrected_prev > 0 ? ((data.resurrected - data.resurrected_prev) / data.resurrected_prev) * 100 : null
  const badge = trendBadge(change, { unit: '%', digits: 0 })

  return (
    <Card className={styles.winBack}>
      <CardHeader title="Win-back" subtitle="Users returning after 30+ days inactive" />

      <Stat label="Resurrected this month">
        <span className={styles.bigValue}>{formatNumber(data.resurrected)}</span>
        {badge && <Badge tone={badge.tone}>{badge.text}</Badge>}
      </Stat>

      {data.top_source && (
        <Stat label="Top trigger">
          <span className={styles.bigValue}>{RETURN_SOURCE_LABEL[data.top_source.source] ?? data.top_source.source}</span>
          <span className={styles.hint}>{formatPercent(data.top_source.share_pct, 0)} of returns</span>
        </Stat>
      )}

      <Stat label="Win-back campaign CTR">
        <span className={styles.bigValue}>{formatPercent(data.winback_ctr_pct)}</span>
        {data.best_campaign && <span className={styles.hint}>“{data.best_campaign}”</span>}
      </Stat>
    </Card>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <div className={styles.statBody}>{children}</div>
    </div>
  )
}
