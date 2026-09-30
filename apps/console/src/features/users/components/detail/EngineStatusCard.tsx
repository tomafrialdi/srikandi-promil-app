import { Badge, Card, CardHeader, DataTable, type Column } from '../../../../shared/ui'
import { MODE_LABEL } from '../../../../shared/lib/labels'
import type { UserDetail } from '../../types'

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
          <button type="button" className="text-12 font-bold text-primary disabled:text-ink-muted disabled:opacity-45" onClick={onViewLog}>
            View engine log
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 min-[801px]:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-0.5 rounded-xl bg-surface px-3.5 py-3">
          <span className="text-10 font-bold tracking-[0.02em] text-ink-faint uppercase">Current status</span>
          <span className="text-18 font-extrabold">{engine.status}</span>
          <span className="text-11 text-ink-muted">{engine.headline}</span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-xl bg-surface px-3.5 py-3">
          <span className="text-10 font-bold tracking-[0.02em] text-ink-faint uppercase">Confidence</span>
          <span className="text-18 font-extrabold">{engine.confidence}%</span>
          <span className="text-11 text-ink-muted">{engine.signals_used} of 3 signals</span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-xl bg-surface px-3.5 py-3">
          <span className="text-10 font-bold tracking-[0.02em] text-ink-faint uppercase">Predicted ovulation</span>
          <span className="text-18 font-extrabold">CD {engine.ovulation_day} · {engine.ovulation_date}</span>
          <span className="text-11 text-ink-muted">window {engine.window}</span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-xl bg-surface px-3.5 py-3">
          <span className="text-10 font-bold tracking-[0.02em] text-ink-faint uppercase">Test day</span>
          <span className="text-18 font-extrabold">{engine.test_date}</span>
          <span className="text-11 text-ink-muted">if ovulation confirmed</span>
        </div>
      </div>

      <span className="text-12 font-bold text-ink-muted">Signal contribution today</span>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Signal contribution">
        {engine.contribution.map((part, index) => (
          <span key={part.label} style={{ flexGrow: part.pct, flexBasis: 0, background: CONTRIBUTION_COLORS[index % CONTRIBUTION_COLORS.length] }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3.5">
        {engine.contribution.map((part, index) => (
          <span key={part.label} className="text-11 text-ink-muted">
            <span style={{ color: CONTRIBUTION_COLORS[index % CONTRIBUTION_COLORS.length] }}>●</span> {part.label} · {part.pct}%
          </span>
        ))}
      </div>

      <span className="text-12 font-bold text-ink-muted">Cycle history</span>
      <DataTable columns={COLUMNS} rows={cycles} rowKey={(r) => String(r.no)} rowHeight={40} />

      {engine.flags && <div className="rounded-[10px] bg-warning-soft px-3 py-2.5 text-12 font-semibold text-warning-ink">{engine.flags}</div>}
    </Card>
  )
}
