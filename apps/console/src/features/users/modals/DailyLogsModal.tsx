import { BracketsCurly, Eye, Notebook } from '@phosphor-icons/react'
import { Badge, Button, DataTable, Modal, ModalFooter, type BadgeTone, type Column } from '../../../shared/ui'
import type { UserLogRow, UserLogs } from '../types'

const MOOD: Record<string, string> = { great: 'Great', good: 'Good', okay: 'Okay', low: 'Low', hard: 'Hard' }
const FLUID: Record<string, string> = { dry: 'Dry', sticky: 'Sticky', creamy: 'Creamy', watery: 'Watery', egg_white: 'Egg white' }
const LH: Record<string, string> = { negative: 'Negative', high: 'High', peak: 'Peak' }
const PREG: Record<string, string> = { negative: 'Negative', faint_line: 'Faint line', positive: 'Positive' }
const PREG_TYPE: Record<string, string> = { strip: 'Strip', digital: 'Digital', blood_hcg: 'Blood hCG' }
const SYMPTOM: Record<string, string> = {
  cramping: 'Cramping',
  bloating: 'Bloating',
  headache: 'Headache',
  fatigue: 'Fatigue',
  nausea: 'Nausea',
  tender_breasts: 'Tender breasts',
}
const FLOW: Record<string, string> = { none: 'None', light: 'Light', medium: 'Medium', heavy: 'Heavy' }

const lhTone = (v: string): BadgeTone => (v === 'peak' ? 'primary' : v === 'high' ? 'warning' : 'neutral')
const pregTone = (v: string): BadgeTone => (v === 'positive' ? 'success' : v === 'faint_line' ? 'warning' : 'neutral')

const dash = <span className="text-ink-faint">—</span>

function downloadJson(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

const columns: Column<UserLogRow>[] = [
  { key: 'date', header: 'DATE', width: 96, render: (r) => <span className="text-12 font-bold">{r.date}</span> },
  {
    key: 'temp',
    header: 'TEMP °C',
    width: 90,
    render: (r) => (r.temperature != null ? <span className="text-12 font-medium">{r.temperature.toFixed(1)}</span> : dash),
  },
  {
    key: 'mood',
    header: 'MOOD',
    width: 110,
    render: (r) =>
      r.mood ? (
        <span className="text-12 font-medium" title={r.mood_note ?? undefined}>
          {MOOD[r.mood] ?? r.mood}
          {r.mood_note ? ' ✎' : ''}
        </span>
      ) : (
        dash
      ),
  },
  {
    key: 'symptoms',
    header: 'SYMPTOMS',
    render: (r) =>
      r.symptoms && r.symptoms.length > 0 ? (
        <span className="text-12 font-medium">{r.symptoms.map((s) => SYMPTOM[s] ?? s).join(', ')}</span>
      ) : (
        dash
      ),
  },
  { key: 'fluid', header: 'FLUID', width: 100, render: (r) => (r.fluid ? <span className="text-12 font-medium">{FLUID[r.fluid] ?? r.fluid}</span> : dash) },
  {
    key: 'lh',
    header: 'LH',
    width: 90,
    render: (r) => (r.lh ? <Badge tone={lhTone(r.lh)}>{LH[r.lh] ?? r.lh}</Badge> : dash),
  },
  {
    key: 'intimacy',
    header: 'INTIMACY',
    width: 90,
    render: (r) => (r.intimacy ? <span className="text-12 font-medium">{r.intimacy === 'yes' ? 'Yes' : 'No'}</span> : dash),
  },
  {
    key: 'preg',
    header: 'PREG. TEST',
    width: 130,
    render: (r) =>
      r.pregnancy_test ? (
        <span className="inline-flex flex-col gap-0.5">
          <Badge tone={pregTone(r.pregnancy_test)}>{PREG[r.pregnancy_test] ?? r.pregnancy_test}</Badge>
          {r.pregnancy_test_type && <span className="text-11 font-medium text-ink-muted">{PREG_TYPE[r.pregnancy_test_type] ?? r.pregnancy_test_type}</span>}
        </span>
      ) : (
        dash
      ),
  },
  { key: 'flow', header: 'FLOW', width: 80, render: (r) => (r.flow ? <span className="text-12 font-medium">{FLOW[r.flow] ?? r.flow}</span> : dash) },
]

/** Unmasked daily logs. Only opened after a reason was entered (logged server-side). */
export function DailyLogsModal({ data, onClose }: { data: UserLogs | null; onClose: () => void }) {
  return (
    <Modal
      open={data !== null}
      onClose={onClose}
      size="xl"
      icon={<Notebook size={20} />}
      title={`Daily logs · ${data?.name ?? ''}`}
      subtitle={data ? `Last ${data.days} days · ${data.rows.length} logged ${data.rows.length === 1 ? 'day' : 'days'} · health data unmasked (logged)` : undefined}
      footer={
        <ModalFooter info={data ? <span className="inline-flex items-center gap-1.5"><Eye size={14} className="text-ink-faint" />This view was logged: {data.logged_by ?? 'you'} · reason {data.reason}</span> : undefined}>
          <Button variant="outline" disabled={!data} onClick={() => data && downloadJson(`daily-logs-${data.name.replace(/\s+/g, '-').toLowerCase()}.json`, data)} leadingIcon={<BracketsCurly size={16} />}>
            Export JSON
          </Button>
        </ModalFooter>
      }
    >
      {data &&
        (data.rows.length === 0 ? (
          <p className="m-0 py-6 text-center text-13 font-medium text-ink-muted">This user hasn't logged anything in the last {data.days} days.</p>
        ) : (
          <DataTable columns={columns} rows={data.rows} rowKey={(r) => r.date} rowHeight={48} bleed={false} />
        ))}
    </Modal>
  )
}
