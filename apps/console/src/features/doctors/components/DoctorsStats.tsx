import { StatCard, StatGrid } from '../../../shared/ui'
import { formatNumber } from '../../../shared/lib/format'
import type { DoctorsSummary } from '../types'

export function DoctorsStats({ data }: { data?: DoctorsSummary }) {
  return (
    <StatGrid columns={4}>
      <StatCard label="Doctors listed" value={data ? formatNumber(data.listed) : '—'} badge={data ? { tone: 'neutral', text: `in ${data.clinics} clinics` } : null} />
      <StatCard label="STR verified" value={data ? formatNumber(data.str_verified) : '—'} badge={data ? { tone: data.str_pending > 0 ? 'warning' : 'success', text: `${data.str_pending} pending` } : null} />
      <StatCard label="Teleconsult active" value={data ? formatNumber(data.tele_active) : '—'} badge={data && data.tele_new_month > 0 ? { tone: 'success', text: `↑ ${data.tele_new_month} this month` } : null} />
      <StatCard label="Avg. rating" value={data?.avg_rating != null ? `${data.avg_rating} ★` : '—'} badge={data ? { tone: 'info', text: `${formatNumber(data.reviews)} reviews` } : null} />
    </StatGrid>
  )
}
