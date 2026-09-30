import { Badge, Card, CardHeader, DataTable, type Column } from '../../../../shared/ui'
import { MODE_LABEL } from '../../../../shared/lib/labels'
import type { UserDetail } from '../../types'
import styles from './UserDetail.module.css'

type CycleRow = UserDetail['cycles'][number]

const CONTRIBUTION_COLORS = ['#c13d68', '#2574c4', '#e07a9b', '#e0a030']
const runFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })

const COLUMNS: Column<CycleRow>[] = [
  { key: 'cycle', header: 'CYCLE', width: 90, render: (r) => `#${r.no}${r.current ? ' (now)' : ''}` },
  { key: 'length', header: 'LENGTH', width: 90, render: (r) => r.length },
  { key: 'ovulation', header: 'OVULATION', render: (r) => r.ovulation },
  { key: 'luteal', header: 'LUTEAL', width: 80, render: (r) => r.luteal },
  {
    key: 'outcome',
    header: 'OUTCOME',
    width: 130,
    render: (r) => <Badge tone={r.outcome === 'Anovulatory?' ? 'warning' : r.outcome === 'Positive test' ? 'success' : r.current ? 'info' : 'neutral'}>{r.outcome}</Badge>,
  },
]

interface EngineStatusCardProps {
  engine: NonNullable<UserDetail['engine']>
  cycles: UserDetail['cycles']
  onViewLog: () => void
}

export function EngineStatusCard({ engine, cycles, onViewLog }: EngineStatusCardProps) {
  return (
    <Card>
      <CardHeader
        title="Fertility engine"
        subtitle={`Rule set ${engine.rule_set} · ${MODE_LABEL[engine.mode]} mode · last run today ${runFormat.format(new Date(engine.run_at))}`}
        action={
          <button type="button" className={styles.cardAction} onClick={onViewLog}>
            View engine log
          </button>
        }
      />

      <div className={styles.now}>
        <div className={styles.nowCell}>
          <span className={styles.nowLabel}>Current status</span>
          <span className={styles.nowBig}>{engine.status}</span>
          <span className={styles.nowSub}>{engine.headline}</span>
        </div>
        <div className={styles.nowCell}>
          <span className={styles.nowLabel}>Confidence</span>
          <span className={styles.nowBig}>{engine.confidence}%</span>
          <span className={styles.nowSub}>{engine.signals_used} of 3 signals</span>
        </div>
        <div className={styles.nowCell}>
          <span className={styles.nowLabel}>Predicted ovulation</span>
          <span className={styles.nowBig}>CD {engine.ovulation_day} · {engine.ovulation_date}</span>
          <span className={styles.nowSub}>window {engine.window}</span>
        </div>
        <div className={styles.nowCell}>
          <span className={styles.nowLabel}>Test day</span>
          <span className={styles.nowBig}>{engine.test_date}</span>
          <span className={styles.nowSub}>if ovulation confirmed</span>
        </div>
      </div>

      <span className={styles.subHeading}>Signal contribution today</span>
      <div className={styles.contribution} role="img" aria-label="Signal contribution">
        {engine.contribution.map((part, index) => (
          <span key={part.label} style={{ flexGrow: part.pct, flexBasis: 0, background: CONTRIBUTION_COLORS[index % CONTRIBUTION_COLORS.length] }} />
        ))}
      </div>
      <div className={styles.stripLegend}>
        {engine.contribution.map((part, index) => (
          <span key={part.label} className={styles.itemLine}>
            <span style={{ color: CONTRIBUTION_COLORS[index % CONTRIBUTION_COLORS.length] }}>●</span> {part.label} · {part.pct}%
          </span>
        ))}
      </div>

      <span className={styles.subHeading}>Cycle history</span>
      <DataTable columns={COLUMNS} rows={cycles} rowKey={(r) => String(r.no)} rowHeight={40} />

      {engine.flags && <div className={styles.flag}>{engine.flags}</div>}
    </Card>
  )
}
