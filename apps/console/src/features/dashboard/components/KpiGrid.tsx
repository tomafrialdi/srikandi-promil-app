import { Pulse, Crown, User, Users, Wallet } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Badge, Card, IconTile } from '../../../shared/ui'
import { formatDelta, formatIdrCompact, formatNumber, formatPercent, toPercentOf } from '../../../shared/lib/format'
import type { Kpis } from '../types'

interface KpiCardProps {
  label: string
  value: string
  icon: ReactNode
  iconBackground: string
  footnote: ReactNode
}

function KpiCard({ label, value, icon, iconBackground, footnote }: KpiCardProps) {
  return (
    <Card className="gap-3 px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="text-13 font-semibold text-ink-muted">{label}</span>
        <IconTile background={iconBackground}>{icon}</IconTile>
      </div>
      <span className="text-26 font-extrabold">{value}</span>
      <div className="flex items-center gap-1.5">{footnote}</div>
    </Card>
  )
}

function Delta({ value }: { value: number | null }) {
  return (
    <>
      <Badge tone={value != null && value < 0 ? 'error' : 'success'}>{formatDelta(value)}</Badge>
      <span className="text-12 text-ink-faint">vs last month</span>
    </>
  )
}

const Plain = ({ children }: { children: ReactNode }) => <span className="text-12 font-semibold text-ink-muted">{children}</span>

export function KpiGrid({ kpis }: { kpis: Kpis }) {
  return (
    <div className="grid grid-cols-2 gap-4 min-[801px]:grid-cols-3 min-[1281px]:grid-cols-5">
      <KpiCard label="Total users" value={formatNumber(kpis.total_users)} icon={<Users size={16} color="var(--secondary)" />} iconBackground="var(--secondary-soft)" footnote={<Delta value={kpis.total_delta_pct} />} />
      <KpiCard
        label="Free users"
        value={formatNumber(kpis.free_users)}
        icon={<User size={16} color="var(--ink-muted)" />}
        iconBackground="var(--surface-alt)"
        footnote={<Plain>{formatPercent(toPercentOf(kpis.free_users, kpis.total_users))} of total</Plain>}
      />
      <KpiCard label="Paid · Srikandi Plus" value={formatNumber(kpis.paid_users)} icon={<Crown size={16} color="var(--primary)" />} iconBackground="var(--primary-soft)" footnote={<Delta value={kpis.paid_delta_pct} />} />
      <KpiCard label="MRR" value={formatIdrCompact(kpis.mrr_idr)} icon={<Wallet size={16} color="var(--success)" />} iconBackground="var(--success-soft)" footnote={<Delta value={kpis.mrr_delta_pct} />} />
      <KpiCard
        label="Daily active"
        value={formatNumber(kpis.daily_active)}
        icon={<Pulse size={16} color="var(--warning-ink)" />}
        iconBackground="var(--warning-soft)"
        footnote={<Plain>{formatPercent(toPercentOf(kpis.daily_active, kpis.monthly_active), 0)} of MAU</Plain>}
      />
    </div>
  )
}
