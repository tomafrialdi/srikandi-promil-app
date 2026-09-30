import { Pulse, Crown, User, Users, Wallet } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Badge, Card, IconTile } from '../../../shared/ui'
import { formatDelta, formatIdrCompact, formatNumber, formatPercent, toPercentOf } from '../../../shared/lib/format'
import type { Kpis } from '../types'
import styles from './KpiGrid.module.css'

interface KpiCardProps {
  label: string
  value: string
  icon: ReactNode
  iconBackground: string
  footnote: ReactNode
}

function KpiCard({ label, value, icon, iconBackground, footnote }: KpiCardProps) {
  return (
    <Card className={styles.card}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        <IconTile background={iconBackground}>{icon}</IconTile>
      </div>
      <span className={styles.value}>{value}</span>
      <div className={styles.footnote}>{footnote}</div>
    </Card>
  )
}

function Delta({ value }: { value: number | null }) {
  return (
    <>
      <Badge tone={value != null && value < 0 ? 'error' : 'success'}>{formatDelta(value)}</Badge>
      <span className={styles.hint}>vs last month</span>
    </>
  )
}

export function KpiGrid({ kpis }: { kpis: Kpis }) {
  return (
    <div className={styles.grid}>
      <KpiCard
        label="Total users"
        value={formatNumber(kpis.total_users)}
        icon={<Users size={16} color="var(--secondary)" />}
        iconBackground="var(--secondary-soft)"
        footnote={<Delta value={kpis.total_delta_pct} />}
      />
      <KpiCard
        label="Free users"
        value={formatNumber(kpis.free_users)}
        icon={<User size={16} color="var(--ink-muted)" />}
        iconBackground="var(--surface-alt)"
        footnote={
          <span className={styles.plain}>
            {formatPercent(toPercentOf(kpis.free_users, kpis.total_users))} of total
          </span>
        }
      />
      <KpiCard
        label="Paid · Srikandi Plus"
        value={formatNumber(kpis.paid_users)}
        icon={<Crown size={16} color="var(--primary)" />}
        iconBackground="var(--primary-soft)"
        footnote={<Delta value={kpis.paid_delta_pct} />}
      />
      <KpiCard
        label="MRR"
        value={formatIdrCompact(kpis.mrr_idr)}
        icon={<Wallet size={16} color="var(--success)" />}
        iconBackground="var(--success-soft)"
        footnote={<Delta value={kpis.mrr_delta_pct} />}
      />
      <KpiCard
        label="Daily active"
        value={formatNumber(kpis.daily_active)}
        icon={<Pulse size={16} color="var(--warning-ink)" />}
        iconBackground="var(--warning-soft)"
        footnote={
          <span className={styles.plain}>
            {formatPercent(toPercentOf(kpis.daily_active, kpis.monthly_active), 0)} of MAU
          </span>
        }
      />
    </div>
  )
}
