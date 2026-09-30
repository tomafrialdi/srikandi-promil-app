import { StatCard, StatGrid } from '../../../shared/ui'
import { formatNumber } from '../../../shared/lib/format'
import type { MedsSummary } from '../types'

export function MedicationsStats({ data }: { data?: MedsSummary }) {
  return (
    <StatGrid columns={4}>
      <StatCard label="Items in catalogue" value={data ? formatNumber(data.catalogue) : '—'} badge={data ? { tone: 'neutral', text: `${data.categories} categories` } : null} />
      <StatCard label="Prescription (Rx)" value={data ? formatNumber(data.rx) : '—'} badge={data ? { tone: 'warning', text: 'needs doctor note' } : null} />
      <StatCard label="Users tracking meds" value={data ? formatNumber(data.users) : '—'} badge={data?.users_pct != null ? { tone: 'info', text: `${data.users_pct}% of users` } : null} />
      <StatCard label="Avg. adherence (7d)" value={data?.adherence != null ? `${data.adherence}%` : '—'} badge={null} />
    </StatGrid>
  )
}
