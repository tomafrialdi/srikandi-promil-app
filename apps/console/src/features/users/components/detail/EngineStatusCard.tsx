import { Flag } from '@phosphor-icons/react'
import { Badge, Card, CardHeader, DataTable, type Column } from '../../../../shared/ui'
import { CardLink } from './CardLink'
import { MODE_LABEL } from '../../../../shared/lib/labels'
import type { UserDetail } from '../../types'

type CycleRow = UserDetail['cycles'][number]

const CONTRIBUTION_COLORS = ['#c13d68', '#e07a9b', '#2574c4', '#a6a49b']
const runFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })

const COLUMNS: Column<CycleRow>[] = [
  { key: 'cycle', header: 'CYCLE', width: 90, render: (r) => <span className="text-12 font-bold">{`#${r.no}${r.current ? ' (now)' : ''}`}</span> },
  { key: 'length', header: 'LENGTH', width: 80, render: (r) => <span className="text-12 font-medium text-ink-muted">{r.length}</span> },
  { key: 'ovulation', header: 'OVULATION', render: (r) => <span className="text-12 font-semibold">{r.ovulation}</span> },
  { key: 'luteal', header: 'LUTEAL', width: 80, render: (r) => <span className="text-12 font-medium text-ink-muted">{r.luteal}</span> },
  {
    key: 'outcome',
    header: 'OUTCOME',
    width: 150,
    render: (r) => <Badge tone={r.outcome === 'Anovulatory?' ? 'warning' : r.outcome === 'Positive test' ? 'success' : r.current ? 'primary' : 'neutral'}>{r.outcome}</Badge>,
  },
]

interface EngineStatusCardProps {
  engine: NonNullable<UserDetail['engine']>
  cycles: UserDetail['cycles']
  onViewLog: () => void
}

export function EngineStatusCard({ engine, cycles, onViewLog }: EngineStatusCardProps) {
  return (
    <Card className="gap-3.5">
      <CardHeader
        title="Fertility engine"
        subtitle={`Rule set ${engine.rule_set} · ${MODE_LABEL[engine.mode]} mode · last run today ${runFormat.format(new Date(engine.run_at))}`}
        action={<CardLink onClick={onViewLog}>View engine log</CardLink>}
      />

      <div className="grid grid-cols-2 gap-3 min-[801px]:grid-cols-4">
        <div className="flex flex-col gap-1.5 rounded-[14px] bg-primary p-4 text-white">
          <span className="text-10 font-extrabold tracking-[0.02em] text-white/70 uppercase">Current status</span>
          <span className="text-20 leading-tight font-extrabold">{engine.status}</span>
          <span className="text-12 font-semibold text-white/80">{engine.headline}</span>
        </div>
        <Stat label="Confidence" value={`${engine.confidence}%`} hint={`${engine.signals_used} of 3 signals`} />
        <Stat label="Predicted ovulation" value={`CD ${engine.ovulation_day} · ${engine.ovulation_date}`} hint={`window ${engine.window}`} />
        <Stat label="Test day" value={engine.test_date} hint="if ovulation confirmed" />
      </div>

      <span className="text-12 font-bold text-ink-muted">Signal contribution today</span>
      <div className="flex h-3.5 overflow-hidden rounded-full" role="img" aria-label="Signal contribution">
        {engine.contribution.map((part, index) => (
          <span key={part.label} style={{ flexGrow: part.pct, flexBasis: 0, background: CONTRIBUTION_COLORS[index % CONTRIBUTION_COLORS.length] }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3.5">
        {engine.contribution.map((part, index) => (
          <span key={part.label} className="inline-flex items-center gap-1.5 text-11 font-semibold text-ink-muted">
            <span className="size-2 rounded-full" style={{ background: CONTRIBUTION_COLORS[index % CONTRIBUTION_COLORS.length] }} />
            {part.label} · {part.pct}%
          </span>
        ))}
      </div>

      <span className="text-12 font-bold text-ink-muted">Cycle history</span>
      <DataTable columns={COLUMNS} rows={cycles} rowKey={(r) => String(r.no)} rowHeight={40} bleed={false} />

      {engine.flags && (
        <div className="flex items-center gap-2 rounded-[10px] bg-warning-soft px-3.5 py-2.5 text-12 font-semibold text-warning-ink">
          <Flag size={14} weight="fill" className="flex-none" />
          {engine.flags}
        </div>
      )}
    </Card>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[14px] bg-surface p-3.5">
      <span className="text-11 font-semibold text-ink-muted">{label}</span>
      <span className="text-15 font-extrabold">{value}</span>
      <span className="text-11 font-medium text-ink-faint">{hint}</span>
    </div>
  )
}
