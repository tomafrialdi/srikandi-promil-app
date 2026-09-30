import { ClockCounterClockwise } from '@phosphor-icons/react'
import { Badge, Modal, ModalFooter, ModalSection, Button, type BadgeTone } from '../../../shared/ui'
import { fmtDate } from '../lib'
import type { EngineState, VersionStatus } from '../types'

const STATUS: Record<VersionStatus, { label: string; tone: BadgeTone }> = {
  live: { label: 'Live', tone: 'success' },
  canary: { label: 'Canary', tone: 'warning' },
  in_review: { label: 'In review', tone: 'info' },
  draft: { label: 'Draft', tone: 'neutral' },
  archived: { label: 'Archived', tone: 'neutral' },
  rolled_back: { label: 'Rolled back', tone: 'error' },
}

const DOT = { success: 'var(--success)', info: 'var(--secondary)', warning: 'var(--warning)', error: 'var(--error)' }

export function VersionHistoryModal({ open, onClose, state }: { open: boolean; onClose: () => void; state?: EngineState }) {
  return (
    <Modal open={open} onClose={onClose} size="md" icon={<ClockCounterClockwise size={20} />} title="Version history" subtitle="Every rule set that has been drafted, tested or released." footer={<ModalFooter info="Released versions are never edited; changes go into a new draft."><Button onClick={onClose}>Done</Button></ModalFooter>}>
      <ModalSection label="Versions">
        <ul className="m-0 flex list-none flex-col p-0">
          {(state?.versions ?? []).map((v) => (
            <li key={v.id} className="flex items-start gap-3 border-b border-border py-3 last:border-b-0">
              <span className="w-14 flex-none font-mono text-13 font-bold">{v.version}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-13 font-semibold">{v.summary ?? 'No summary'}</span>
                <span className="text-11 text-ink-muted">
                  {v.author ? `${v.author} · ` : ''}created {fmtDate(v.created_at)}
                  {v.canary_at ? ` · canary ${fmtDate(v.canary_at)}` : ''}
                  {v.live_at ? ` · live ${fmtDate(v.live_at)}` : ''}
                  {v.signed_off_by ? ` · signed off by ${v.signed_off_by}` : ''}
                </span>
              </div>
              <Badge tone={STATUS[v.status].tone}>{v.status === 'canary' ? `Canary ${v.rollout_pct}%` : STATUS[v.status].label}</Badge>
            </li>
          ))}
        </ul>
      </ModalSection>
      <ModalSection label="Recent activity">
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {(state?.events ?? []).slice(0, 10).map((e) => (
            <li key={e.id} className="flex gap-2.5">
              <span className="mt-1.5 size-2 flex-none rounded-full" style={{ background: DOT[e.tone] }} />
              <span className="flex min-w-0 flex-col">
                <span className="text-13 font-semibold">{e.title}</span>
                <span className="text-11 text-ink-muted">{fmtDate(e.at)}{e.detail ? ` · ${e.detail}` : ''}</span>
              </span>
            </li>
          ))}
        </ul>
      </ModalSection>
    </Modal>
  )
}
