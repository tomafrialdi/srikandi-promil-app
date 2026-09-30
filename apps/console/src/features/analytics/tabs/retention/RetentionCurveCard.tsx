import { Card, CardHeader } from '../../../../shared/ui'
import { Legend, LineChart, type LineSeries } from '../../../../shared/charts'
import type { RetentionData } from '../../types'
import styles from './RetentionTab.module.css'

const SEGMENTS: Record<RetentionData['curve'][number]['segment'], { label: string; color: string; emphasis?: boolean }> = {
  partner_linked: { label: 'Partner linked', color: '#c13d68', emphasis: true },
  solo: { label: 'Solo', color: '#2574c4' },
  calendar_only: { label: 'Calendar-only', color: '#a6a49b' },
}

const pointAt = (data: RetentionData['curve'], segment: string, week: number) =>
  data.find((s) => s.segment === segment)?.points.find((p) => p.week === week)?.pct ?? null

export function RetentionCurveCard({ data }: { data: RetentionData['curve'] }) {
  const weeks = data[0]?.points.map((p) => p.week) ?? []
  const series: LineSeries[] = data.map((s) => ({
    name: SEGMENTS[s.segment].label,
    color: SEGMENTS[s.segment].color,
    emphasis: SEGMENTS[s.segment].emphasis,
    values: s.points.map((p) => p.pct),
  }))

  const partnerW8 = pointAt(data, 'partner_linked', 8)
  const calendarW8 = pointAt(data, 'calendar_only', 8)
  const calendarW12 = pointAt(data, 'calendar_only', 12)
  const ratio = partnerW8 != null && calendarW8 ? partnerW8 / calendarW8 : null

  return (
    <Card className={styles.grow}>
      <CardHeader
        title="Retention curve by segment"
        subtitle="% active in week N after sign-up"
        action={<Legend items={Object.values(SEGMENTS).map(({ label, color }) => ({ label, color }))} />}
      />
      <LineChart series={series} xLabels={weeks.map((w) => `W${w}`)} height={220} />
      {ratio != null && (
        <p className={styles.insight}>
          Partner-linked users retain {Number(ratio.toFixed(1))}× better at W8.
          {calendarW12 != null && ` Calendar-only users drop to ${calendarW12}% by W12.`}
        </p>
      )}
    </Card>
  )
}
