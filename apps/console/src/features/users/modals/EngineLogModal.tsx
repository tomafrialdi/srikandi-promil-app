import { Pulse } from '@phosphor-icons/react'
import { Badge, Button, DataTable, Modal, ModalFooter, ModalSection, type Column } from '../../../shared/ui'
import { MODE_LABEL } from '../../../shared/lib/labels'
import type { EngineLog } from '../types'
import parts from './modal-parts.module.css'

type Day = EngineLog['day_by_day'][number]

const COLUMNS: Column<Day>[] = [
  { key: 'cd', header: 'CD', width: 44, render: (d) => d.cd },
  { key: 'date', header: 'DATE', width: 70, render: (d) => d.date },
  { key: 'bbt', header: 'BBT °C', width: 76, render: (d) => d.bbt ?? '—' },
  { key: 'lh', header: 'LH', width: 80, render: (d) => d.lh ?? '—' },
  { key: 'fluid', header: 'CERVICAL FLUID', width: 120, render: (d) => d.fluid ?? '—' },
  { key: 'score', header: 'SCORE', width: 64, render: (d) => d.score },
  {
    key: 'output',
    header: 'STATUS OUTPUT',
    render: (d) => <Badge tone={d.output.includes('High') || d.output.includes('Peak') ? 'success' : 'neutral'}>{d.output}</Badge>,
  },
]

function downloadJson(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

/** Unmasked engine decision log. Only opened after a reason was entered (logged server-side). */
export function EngineLogModal({ data, onClose }: { data: EngineLog | null; onClose: () => void }) {
  return (
    <Modal
      open={data !== null}
      onClose={onClose}
      size="xl"
      icon={<Pulse size={20} />}
      title={`Fertility engine log · ${data?.name ?? ''}`}
      subtitle={data ? `Cycle ${data.cycle_no} · ${MODE_LABEL[data.mode]} mode · rule set ${data.rule_set} · health data unmasked (logged)` : undefined}
      footer={
        <ModalFooter info={data ? `This view was logged: ${data.logged_by ?? 'you'} · reason ${data.reason}` : undefined}>
          <Button variant="outline" onClick={() => data && downloadJson(`engine-log-cycle-${data.cycle_no}.json`, data)}>
            Export JSON
          </Button>
          <Button variant="outline" disabled title="Simulator replay is not available yet">
            Replay in simulator
          </Button>
        </ModalFooter>
      }
    >
      {data && (
        <>
          <div className={parts.tiles}>
            <Tile label="Status now" value={data.status} />
            <Tile label="Confidence" value={`${data.confidence}%`} />
            <Tile label="Predicted ovulation" value={data.predicted_ovulation} />
            <Tile label="Overrides" value={data.overrides_count > 0 ? `${data.overrides_count} (support)` : 'None'} />
          </div>

          <ModalSection label="Day-by-day">
            <DataTable columns={COLUMNS} rows={data.day_by_day} rowKey={(d) => String(d.cd)} rowHeight={38} bleed={false} />
          </ModalSection>

          <ModalSection label="Decision trace · today 06:21">
            <ol className={parts.trace}>
              {data.decision_trace.map((step) => (
                <li key={step.step} className={parts.traceItem}>
                  <span className={parts.traceStep}>{step.step}</span>
                  <span className={parts.traceBody}>{step.body}</span>
                </li>
              ))}
            </ol>
          </ModalSection>

          {data.overrides.map((override) => (
            <div key={override.at} className={parts.callout}>
              <strong>Support override · {override.at}</strong>
              <span>
                {override.by} changed LH result “{override.from}” → “{override.to}” (ticket {override.ticket}).
              </span>
            </div>
          ))}
        </>
      )}
    </Modal>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className={parts.tile}>
      <span className={parts.tileLabel}>{label}</span>
      <span className={parts.tileValue}>{value}</span>
    </div>
  )
}
