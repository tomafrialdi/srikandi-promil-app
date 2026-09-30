import { Badge, Button, Card } from '../../../../shared/ui'
import { Columns, type ColumnItem } from '../../../../shared/charts'
import { formatIdr, formatNumber } from '../../../../shared/lib/format'
import { PROMO_STATUS } from '../../config/labels'
import type { PromoDetail } from '../../types'
import styles from './promos.module.css'

const CHANNEL_NAMES: Record<string, string> = { midtrans: 'Midtrans', google_play: 'Google Play offer', apple: 'Apple offer code' }

interface PromoDetailPanelProps {
  data: PromoDetail
  busy: boolean
  onToggle: () => void
  onDuplicate: () => void
  onEdit: () => void
}

export function PromoDetailPanel({ data, busy, onToggle, onDuplicate, onEdit }: PromoDetailPanelProps) {
  const status = PROMO_STATUS[data.status]
  const pct = data.max_uses ? Math.min(100, (data.used_count / data.max_uses) * 100) : 0
  const items: ColumnItem[] = data.per_day.map((d) => ({ label: '', value: d.count, color: 'rgba(193, 61, 104, 0.6)', title: `${d.day}: ${d.count}` }))

  const example = data.example
  const discounted =
    example && data.discount_type === 'percentage' ? example.price_idr - Math.round((example.price_idr * data.discount_pct) / 100) : null

  return (
    <Card className={styles.panel}>
      <div className={styles.panelHead}>
        <h2 className={styles.panelCode}>{data.code}</h2>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      <p className={styles.panelText}>
        {data.offer}
        {example && discounted != null ? ` (${formatIdr(example.price_idr)} → ${formatIdr(discounted)})` : ''}
        {data.internal_note ? ` · ${data.internal_note}` : ''}
      </p>

      <div>
        <div className={styles.usageRow}>
          <span>{formatNumber(data.used_count)} of {data.max_uses ? formatNumber(data.max_uses) : '∞'} used</span>
          {data.days_left != null && <span>{data.days_left} days left</span>}
        </div>
        {data.max_uses ? <div style={{ marginTop: 6 }}><ProgressBarInline value={pct} /></div> : null}
      </div>

      <span className={styles.subHeading}>Redemptions per day · 30 days</span>
      <Columns items={items} height={80} gap={2} radius={2} />

      <dl className={styles.kv}>
        <div className={styles.kvRow}><dt>Eligible</dt><dd>{data.eligibility}</dd></div>
        <div className={styles.kvRow}><dt>Limit</dt><dd>{data.per_user_limit} per user · {data.max_uses ? formatNumber(data.max_uses) : '∞'} total</dd></div>
        <div className={styles.kvRow}><dt>Channels</dt><dd>{data.channels.map((c) => CHANNEL_NAMES[c] ?? c).join(' · ')}</dd></div>
        <div className={styles.kvRow}><dt>Stacking</dt><dd>{data.combinable ? 'Combinable' : 'Not combinable'}</dd></div>
      </dl>

      {data.performance.flagged > 0 && (
        <div className={styles.flag}>{data.performance.flagged} redemptions flagged — review before payout.</div>
      )}

      <div className={styles.panelActions}>
        {(data.stored_status === 'active' || data.stored_status === 'paused') && (
          <Button variant="outline" onClick={onToggle} disabled={busy}>{data.stored_status === 'paused' ? 'Resume' : 'Pause'}</Button>
        )}
        <Button variant="outline" onClick={onDuplicate}>Duplicate</Button>
        <Button onClick={onEdit}>Edit</Button>
      </div>
    </Card>
  )
}

function ProgressBarInline({ value }: { value: number }) {
  return (
    <div style={{ height: 8, borderRadius: 100, background: 'var(--surface-alt)', overflow: 'hidden' }}>
      <div style={{ width: `${value}%`, height: '100%', background: 'var(--primary)' }} />
    </div>
  )
}
