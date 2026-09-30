import { Copy, Eye, Flag, GearSix, ArrowCounterClockwise, Scroll, ShieldCheck, ShieldWarning, Ticket, User } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, ConfirmDialog, Modal, ModalFooter, ModalSection, PageState, ReasonDialog, useDisclosure, useToast } from '../../../shared/ui'
import { ACCESS_LABEL, RISK_LABEL, RISK_TONE } from '../config/labels'
import { useAuditEvent } from '../hooks/useAuditData'
import { InfoGrid, Timeline } from '../components/InfoGrid'
import { fullTime, shortHash, spanText, timeOnly } from '../lib/format'
import { prettyJson, readMeta, ticketNumber } from '../lib/metadata'
import { flagEvent, revertEvent } from '../services/audit.service'
import type { AuditSummary } from '../types'

interface EventModalProps {
  id: number | null
  open: boolean
  onClose: () => void
  summary?: AuditSummary
  onChanged: () => void
}

const icon = (category: string) => (category === 'data_access' ? <Eye size={20} /> : category === 'roles' || category === 'engine' ? <GearSix size={20} /> : <Scroll size={20} />)

function Diff({ label, value, tone }: { label: string; value: Record<string, unknown>; tone: 'before' | 'after' }) {
  return (
    <div className={`min-w-0 flex-1 rounded-xl p-3.5 ${tone === 'before' ? 'bg-error-soft' : 'bg-success-soft'}`}>
      <span className="text-11 font-bold text-ink-muted">{label}</span>
      <pre className="m-0 mt-1.5 overflow-x-auto font-mono text-11 leading-relaxed whitespace-pre-wrap">{prettyJson(value)}</pre>
    </div>
  )
}

export function EventModal({ id, open, onClose, summary, onChanged }: EventModalProps) {
  const toast = useToast()
  const navigate = useNavigate()
  const { data: e, error } = useAuditEvent(id)
  const flag = useDisclosure()
  const revert = useDisclosure()
  const m = e ? readMeta(e) : null
  const ticket = ticketNumber(m?.ticket ?? m?.reason ?? null)
  const canAct = summary?.can_act ?? false

  const copy = async () => {
    if (!e) return
    try {
      await navigator.clipboard.writeText(prettyJson(e))
      toast({ title: 'Copied', description: `${e.evt} as JSON` })
    } catch {
      toast({ title: 'Could not copy', description: 'Your browser blocked clipboard access.' })
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="lg"
        icon={icon(e?.category ?? '')}
        title={e?.summary ?? e?.action ?? 'Audit event'}
        subtitle={e ? `${e.evt} · ${fullTime(e.at)}` : undefined}
        headerActions={e && <Badge tone={RISK_TONE[e.risk]}>{RISK_LABEL[e.risk]} risk</Badge>}
        footer={
          <ModalFooter info={e?.flag ? `Flagged for DPO review${e.flag.by ? ` by ${e.flag.by}` : ''}` : m?.canRevert && summary?.can_revert ? 'Revert creates a new audit event' : e ? 'Audit events can never be edited or deleted' : ''}>
            <Button variant="outline" onClick={copy} disabled={!e} leadingIcon={<Copy size={15} />}>Copy JSON</Button>
            {ticket && <Button variant="outline" onClick={() => navigate(`/support-tickets?q=${ticket}`)} leadingIcon={<Ticket size={15} />}>Open ticket</Button>}
            {e?.user_id && <Button variant="outline" onClick={() => navigate(`/users/${e.user_id}`)} leadingIcon={<User size={15} />}>View user</Button>}
            {e && canAct && !e.flag && <Button variant="outline" onClick={flag.onOpen} leadingIcon={<Flag size={15} />}>Flag for DPO</Button>}
            {e && m?.canRevert && summary?.can_revert && <Button variant="danger" onClick={revert.onOpen} leadingIcon={<ArrowCounterClockwise size={15} />}>Revert change</Button>}
          </ModalFooter>
        }
      >
        {!e || !m ? (
          <PageState title={error ?? 'Loading event…'} />
        ) : (
          <>
            <InfoGrid
              items={[
                ['Actor', `${e.actor.name}${e.actor.role ? ` · ${e.actor.role}` : ''}`],
                ['Target', m.targetName ?? e.resource],
                ['Reason', m.reason],
                ['Approval', m.approver],
                ['IP', e.ip],
                ['Device', e.device],
                ['Auth', m.auth],
                ['Ticket', m.ticket],
                ['Action', e.action],
              ]}
            />

            {m.fields.length > 0 && (
              <ModalSection label="Fields accessed">
                <ul className="m-0 flex list-none flex-col rounded-xl border border-border p-0">
                  {m.fields.map((f) => {
                    const a = ACCESS_LABEL[f.access] ?? ACCESS_LABEL.viewed!
                    return (
                      <li key={f.label} className="flex items-center justify-between gap-3 border-b border-border px-3.5 py-2.5 last:border-b-0">
                        <span className="text-13 font-semibold">{f.label}</span>
                        <Badge tone={a.tone}>{a.label}</Badge>
                      </li>
                    )
                  })}
                </ul>
                {m.durationSeconds != null && <p className="text-12 font-medium text-ink-muted">Unmasked for {spanText(m.durationSeconds)} · auto-remasked afterwards</p>}
              </ModalSection>
            )}

            {m.before && m.after && (
              <ModalSection label="Diff">
                <div className="flex gap-3 max-[700px]:flex-col">
                  <Diff label="BEFORE" value={m.before} tone="before" />
                  <Diff label="AFTER" value={m.after} tone="after" />
                </div>
              </ModalSection>
            )}

            {m.impact.length > 0 && (
              <ModalSection label="Impact">
                <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-13 font-medium">
                  {m.impact.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </ModalSection>
            )}

            {e.related.length > 1 && (
              <ModalSection label="Related events">
                <Timeline items={e.related.map((r) => ({ key: String(r.id), time: timeOnly(r.at), text: r.self ? `${r.text} (this event)` : r.text, state: r.self ? 'now' : 'done' }))} />
              </ModalSection>
            )}

            <section className={`flex flex-col gap-1.5 rounded-xl px-4 py-3.5 ${summary?.chain?.ok === false ? 'bg-error-soft' : 'bg-success-soft'}`}>
              <h3 className="flex items-center gap-2 text-13 font-extrabold">
                {summary?.chain?.ok === false ? <ShieldWarning size={16} weight="fill" className="text-error" /> : <ShieldCheck size={16} weight="fill" className="text-success" />}
                {summary?.chain?.ok === false ? 'Hash chain broken — see the Chain integrity card' : summary?.chain ? 'Hash chain verified' : 'Hash chain not verified yet'}
              </h3>
              <p className="font-mono text-11 font-medium text-ink-muted">event · sha256:{shortHash(e.hash)}</p>
              <p className="font-mono text-11 font-medium text-ink-muted">previous · sha256:{shortHash(e.prev_hash)}</p>
            </section>
          </>
        )}
      </Modal>

      <ReasonDialog
        open={flag.open}
        onClose={flag.onClose}
        icon={<Flag size={20} />}
        title="Flag for DPO review?"
        description="The DPO sees flagged events in their weekly review of health-data access."
        confirmLabel="Flag event"
        reasonLabel="Note for the DPO"
        placeholder="e.g. unmask not linked to a ticket"
        onConfirm={async (note) => {
          if (!e) return
          await flagEvent(e.id, note)
          toast({ title: 'Flagged for DPO', description: e.evt })
          onChanged()
        }}
      />
      <ConfirmDialog
        open={revert.open}
        onClose={revert.onClose}
        icon={<ArrowCounterClockwise size={20} />}
        title="Revert this role change?"
        description="The member gets their previous role back and their sessions follow the security policy. This is written to the log as a new event."
        confirmLabel="Revert change"
        tone="danger"
        onConfirm={async () => {
          if (!e) return
          await revertEvent(e.id)
          toast({ title: 'Role change reverted', description: e.summary ?? e.action })
          onChanged()
          onClose()
        }}
      />
    </>
  )
}
