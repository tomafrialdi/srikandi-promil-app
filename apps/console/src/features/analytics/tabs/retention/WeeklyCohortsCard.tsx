import { Card, CardHeader } from '../../../../shared/ui'
import { COHORT_LEGEND, CohortTable, Legend } from '../../../../shared/charts'
import type { RetentionData } from '../../types'

const dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const WEEK_LABELS = Array.from({ length: 11 }, (_, i) => `W${i}`)

export function WeeklyCohortsCard({ data }: { data: RetentionData['weekly_cohorts'] }) {
  return (
    <Card>
      <CardHeader
        title="Weekly cohort retention"
        subtitle="Sign-up week × weeks since sign-up"
        action={<Legend items={COHORT_LEGEND} />}
      />
      <CohortTable
        weekLabels={WEEK_LABELS}
        rows={data.map((row) => ({
          label: dayMonth.format(new Date(row.week_start)),
          users: row.users,
          values: row.weeks,
        }))}
      />
    </Card>
  )
}
