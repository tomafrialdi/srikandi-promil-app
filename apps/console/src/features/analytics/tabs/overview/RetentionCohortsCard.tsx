import { Card, CardHeader } from '../../../../shared/ui'
import { COHORT_LEGEND, CohortTable, Legend } from '../../../../shared/charts'
import type { OverviewData } from '../../types'
import styles from './OverviewTab.module.css'

const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const WEEK_LABELS = ['W0', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6']

function insight(rows: OverviewData['retention_cohorts']): string | null {
  const w4 = rows.map((r) => r.weeks[4]).filter((v): v is number => v != null)
  const first = w4[0]
  const last = w4[w4.length - 1]
  if (first == null || last == null || w4.length < 2 || first === last) return null
  return `Week-4 retention ${last > first ? 'improved' : 'dropped'} from ${first}% → ${last}% across recent sign-up cohorts.`
}

export function RetentionCohortsCard({ data }: { data: OverviewData['retention_cohorts'] }) {
  const note = insight(data)
  return (
    <Card>
      <CardHeader
        title="Retention by sign-up cohort"
        subtitle="% of users active in week N after sign-up"
        action={<Legend items={COHORT_LEGEND} />}
      />
      <CohortTable
        weekLabels={WEEK_LABELS}
        rows={data.map((row) => ({
          label: monthFormat.format(new Date(row.cohort)),
          users: row.users,
          values: row.weeks,
        }))}
      />
      {note && <p className={styles.insight}>{note}</p>}
    </Card>
  )
}
