import { Card, CardHeader } from '../../../../shared/ui'
import { HeatGrid } from '../../../../shared/charts'
import type { EngagementData } from '../../types'
import styles from './EngagementTab.module.css'

const HOURS = [5, 6, 7, 8, 9, 12, 15, 18, 20, 21, 22, 23]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const pad = (hour: number) => String(hour).padStart(2, '0')

export function HeatmapCard({ data }: { data: EngagementData['heatmap'] }) {
  const values = DAYS.map((_, d) =>
    HOURS.map((hour) => data.find((cell) => cell.dow === d + 1 && cell.hour === hour)?.count ?? 0),
  )
  const totals = HOURS.map((hour, c) => ({ hour, total: values.reduce((sum, row) => sum + (row[c] ?? 0), 0) }))
  const [peak, second] = [...totals].sort((a, b) => b.total - a.total)

  return (
    <Card className={styles.heatmap}>
      <CardHeader title="When users open the app" subtitle="Sessions by weekday × hour (Jakarta time)" />
      <HeatGrid rowLabels={DAYS} colLabels={HOURS.map(pad)} values={values} />
      {peak && second && (
        <p className={styles.note}>
          Peak {pad(peak.hour)}:00–{pad(peak.hour + 1)}:00. Second peak {pad(second.hour)}:00.
        </p>
      )}
    </Card>
  )
}
