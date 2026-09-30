import { Columns } from '@phosphor-icons/react'
import { Button, Modal, ModalFooter, ModalSection } from '../../../shared/ui'
import { MODES, SIGNAL_LABEL } from '../engine/fields'
import { fmtWeight } from '../lib'
import type { EngineConfig, SignalKey } from '../types'

const PARAM_ROWS: Array<[string, string]> = [
  ['cycle_len', 'Valid cycle length'],
  ['fertile_window', 'Fertile window'],
  ['lh_rule', 'LH rule for Peak'],
  ['bbt_confirm', 'BBT shift to confirm'],
  ['min_signals', 'Min. signals'],
  ['late_alert', 'Late-period alert'],
]
const SIGNALS: SignalKey[] = ['lh', 'cf', 'bbt', 'calendar', 'skin', 'protocol']

export function CompareModesModal({ open, onClose, config }: { open: boolean; onClose: () => void; config: EngineConfig }) {
  const cols = `minmax(150px,1.2fr) repeat(4, minmax(0,1fr))`
  const cell = 'flex min-w-0 items-center border-b border-border py-2.5 text-12 font-semibold'
  return (
    <Modal open={open} onClose={onClose} size="xl" icon={<Columns size={20} />} title="Compare modes" subtitle="Signal weights and key parameters side by side. Highlighted cells differ from TTC." footer={<ModalFooter info="Read-only view of the current version"><Button onClick={onClose}>Done</Button></ModalFooter>}>
      <ModalSection label="Signal weights">
        <div className="grid gap-x-3 overflow-x-auto" style={{ gridTemplateColumns: cols }}>
          <span className="border-b border-border py-2 text-11 font-bold text-ink-faint" />
          {MODES.map((m) => <span key={m.key} className="border-b border-border py-2 text-11 font-bold text-ink-faint uppercase">{m.label}</span>)}
          {SIGNALS.map((s) => (
            <div key={s} className="contents">
              <span className={`${cell} text-ink-muted`}>{SIGNAL_LABEL[s]}</span>
              {MODES.map((m) => {
                const v = config.modes[m.key].weights[s]
                const diff = m.key !== 'ttc' && v !== config.modes.ttc.weights[s]
                return <span key={m.key} className={`${cell} font-mono`}><span className="rounded-md px-1.5 py-0.5" style={diff ? { background: 'var(--warning-soft)' } : undefined}>{v === 0 && m.key !== 'ttc' && diff ? 'off' : fmtWeight(v)}</span></span>
              })}
            </div>
          ))}
        </div>
      </ModalSection>
      <ModalSection label="Parameters">
        <div className="grid gap-x-3 overflow-x-auto" style={{ gridTemplateColumns: cols }}>
          {PARAM_ROWS.map(([key, label]) => (
            <div key={key} className="contents">
              <span className={`${cell} text-ink-muted`}>{label}</span>
              {MODES.map((m) => {
                const v = config.modes[m.key].params.find((p) => p.key === key)?.value
                const base = config.modes.ttc.params.find((p) => p.key === key)?.value
                return <span key={m.key} className={`${cell} font-mono`}><span className="rounded-md px-1.5 py-0.5 leading-snug" style={m.key !== 'ttc' && v && v !== base ? { background: 'var(--warning-soft)' } : undefined}>{v ?? '—'}</span></span>
              })}
            </div>
          ))}
        </div>
      </ModalSection>
    </Modal>
  )
}
