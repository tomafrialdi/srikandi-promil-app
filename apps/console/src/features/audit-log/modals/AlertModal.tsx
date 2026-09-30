import { Check, Envelope, ShieldWarning, Warning } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Badge, Button, Modal, ModalFooter, ModalSection, Notice, PageState, RadioCard, TextAreaField, useToast } from '../../../shared/ui'
import { cn } from '../../../shared/lib/cn'
import { ALERT_STATUS, CONTAINMENT, RESOLUTIONS, SEVERITY_TONE } from '../config/labels'
import { useAlert } from '../hooks/useAuditData'
import { InfoGrid } from '../components/InfoGrid'
import { dayTime, timeOnly } from '../lib/format'
import { containAlert, resolveAlert } from '../services/audit.service'

interface AlertModalProps {
  id: string | null
  open: boolean
  onClose: () => void
  canAct: boolean
  onChanged: () => void
}

export function AlertModal({ id, open, onClose, canAct, onChanged }: AlertModalProps) {
  const toast = useToast()
  const { data: a, error, reload } = useAlert(id)
  const [resolution, setResolution] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [fail, setFail] = useState<string | null>(null)

  useEffect(() => {
    setResolution(a?.resolution ?? '')
    setNote(a?.note ?? '')
    setFail(null)
  }, [a?.id, a?.resolution, a?.note])

  const run = async (key: string, work: () => Promise<void>) => {
    setBusy(key)
    setFail(null)
    try {
      await work()
    } catch (err) {
      setFail(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(null)
    }
  }

  const contain = (kind: string, title: string) =>
    run(kind, async () => {
      await containAlert(a!.id, kind)
      toast({ title, description: `Alert #${a!.number}` })
      reload()
      onChanged()
    })

  const save = () =>
    run('save', async () => {
      await resolveAlert(a!.id, resolution, note)
      toast({ title: resolution === 'follow_up' ? 'Kept open for follow-up' : 'Alert closed', description: `Alert #${a!.number}` })
      onChanged()
      onClose()
    })

  const closed = a?.status === 'closed'
  const peak = Math.max(1, ...(a?.hourly ?? [0]))
  const done = new Set(a?.containment.map((c) => c.kind))
  const status = a ? ALERT_STATUS[a.status]! : null

  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      size="xl"
      icon={<ShieldWarning size={20} />}
      title={a ? `Security alert · ${a.title}` : 'Security alert'}
      subtitle={a ? `alert_${String(a.number).padStart(4, '0')}${a.subject ? ` · rule: ${a.subject}` : ''}` : undefined}
      headerActions={status && <Badge tone={status.tone}>{status.label}</Badge>}
      footer={
        <ModalFooter info={a ? `${a.assigned ? `Assigned to ${a.assigned}` : 'Not assigned yet'} · ${dayTime(a.created_at)}` : ''}>
          {a?.actor && <a className="inline-flex items-center gap-2 rounded-control border border-border bg-card px-3.5 py-[9px] text-13 font-bold text-ink" href={`mailto:${a.actor.email}?subject=${encodeURIComponent(`Security alert #${a.number}`)}`}><Envelope size={15} /> Contact actor</a>}
          {canAct && !closed && <Button onClick={save} disabled={!a || !resolution || note.trim().length < 3 || busy !== null}>{busy === 'save' ? 'Saving…' : resolution === 'follow_up' ? 'Save for follow-up' : 'Save & close alert'}</Button>}
        </ModalFooter>
      }
    >
      {!a ? (
        <PageState title={error ?? 'Loading alert…'} />
      ) : (
        <>
          {fail && <Notice tone="error" icon={<Warning size={16} />}>{fail}</Notice>}
          {a.unmask_block_until && <Notice tone="warning" icon={<Warning size={16} />}>Unmask permission is suspended for {a.actor?.name ?? 'the actor'} until {dayTime(a.unmask_block_until)}.</Notice>}
          <InfoGrid items={[['Actor', a.actor ? `${a.actor.name} · ${a.actor.role}` : '—'], ['What happened', a.detail], ['Severity', <Badge key="s" tone={SEVERITY_TONE[a.severity]}>{a.severity}</Badge>]]} />

          {a.hourly.some((n) => n > 0) && (
            <ModalSection label="Unmasks per hour · today">
              <div className="flex h-24 items-end gap-1" role="img" aria-label="Unmasks per hour">
                {a.hourly.map((n, h) => (
                  <div key={h} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    {n > 0 && <span className="text-10 font-bold">{n}</span>}
                    <span className={cn('w-full rounded-t', n === peak && n > 0 ? 'bg-error' : n > 0 ? 'bg-primary' : 'bg-surface-alt')} style={{ height: `${Math.max(3, (n / peak) * 60)}px` }} />
                    <span className="text-9 font-medium text-ink-faint">{String(h).padStart(2, '0')}</span>
                  </div>
                ))}
              </div>
            </ModalSection>
          )}

          {a.profiles.length > 0 && (
            <ModalSection label="Profiles unmasked">
              <ul className="m-0 flex list-none flex-col rounded-xl border border-border p-0">
                {a.profiles.slice(0, 6).map((p, i) => (
                  <li key={i} className="flex items-center gap-3 border-b border-border px-3.5 py-2.5 last:border-b-0">
                    <span className="w-12 flex-none font-mono text-11 text-ink-muted">{timeOnly(p.at)}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-12 font-bold">{p.resource ?? '—'}</span>
                    <span className="font-mono text-11 text-ink-muted">{p.ticket ?? '—'}</span>
                    <Badge tone={p.ticket ? 'success' : 'error'}>{p.ticket ? 'Linked ticket' : 'No ticket'}</Badge>
                  </li>
                ))}
              </ul>
              <p className="text-12 font-medium text-ink-muted">
                {a.profiles.length > 6 ? `+ ${a.profiles.length - 6} more · ` : ''}
                {a.profiles.filter((p) => p.ticket).length} of {a.profiles.length} linked to tickets
              </p>
            </ModalSection>
          )}

          {a.actor && (
            <ModalSection label="Containment">
              <div className="grid gap-2.5 min-[701px]:grid-cols-3">
                {CONTAINMENT.map((c) => (
                  <button key={c.kind} type="button" disabled={!canAct || closed || busy !== null || done.has(c.kind)} onClick={() => contain(c.kind, c.title)} className="flex flex-col items-start gap-0.5 rounded-xl border border-border bg-card px-3.5 py-3 text-left enabled:hover:bg-surface disabled:opacity-60">
                    <span className="flex items-center gap-1.5 text-13 font-bold">{done.has(c.kind) && <Check size={14} weight="bold" className="text-success" />}{busy === c.kind ? 'Working…' : c.title}</span>
                    <span className="text-11 text-ink-muted">{done.has(c.kind) ? `Done ${dayTime(a.containment.find((x) => x.kind === c.kind)!.at)}` : c.description}</span>
                  </button>
                ))}
              </div>
            </ModalSection>
          )}

          <ModalSection label="Resolution">
            <div className="grid gap-2.5 min-[701px]:grid-cols-3">
              {RESOLUTIONS.map((r) => (
                <RadioCard key={r.value} name="alert-resolution" selected={resolution === r.value} onSelect={() => setResolution(r.value)} title={r.label} description={r.description} disabled={!canAct || closed} />
              ))}
            </div>
            <TextAreaField aria-label="Resolution note" placeholder="What did you find? This note is kept with the alert." maxLength={600} value={note} onChange={(e) => setNote(e.target.value)} disabled={!canAct || closed} />
          </ModalSection>
        </>
      )}
    </Modal>
  )
}
