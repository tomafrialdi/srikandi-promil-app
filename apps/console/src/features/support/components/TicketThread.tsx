import { ArrowCounterClockwise, GitBranch, User } from '@phosphor-icons/react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, SelectField, useToast } from '../../../shared/ui'
import { PLAN_LABEL, PLATFORM_LABEL, PRIORITY_OPTIONS } from '../config/labels'
import { assignTicket, setTicketStatus, updateTicket } from '../services/support.service'
import type { Agent, Macro, Priority, SupportSummary, TicketFull } from '../types'
import { Composer } from './Composer'
import { MessageBubble } from './MessageBubble'

interface TicketThreadProps {
  ticket: TicketFull
  summary?: SupportSummary
  agents: Agent[]
  macros: Macro[]
  onChanged: () => void
  onEscalate: () => void
}

export function TicketThread({ ticket: t, summary, agents, macros, onChanged, onEscalate }: TicketThreadProps) {
  const toast = useToast()
  const endRef = useRef<HTMLDivElement>(null)
  const me = summary?.me
  const canAct = t.can_act

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [t.id, t.messages.length])

  const run = async (task: () => Promise<void>, failure: string) => {
    try {
      await task()
      onChanged()
    } catch (err) {
      toast({ tone: 'error', title: failure, description: err instanceof Error ? err.message : undefined })
    }
  }

  const who = [
    `#TCK-${t.number}`,
    t.requester.name,
    [t.requester.platform && (PLATFORM_LABEL[t.requester.platform] ?? t.requester.platform), t.requester.app_version].filter(Boolean).join(' '),
    t.requester.plan ? PLAN_LABEL[t.requester.plan] ?? t.requester.plan : '',
  ].filter(Boolean)

  const assignOptions = [
    { value: '', label: 'Unassigned' },
    ...(me && agents.some((a) => a.id === me) ? [{ value: me, label: 'Assign: me' }] : []),
    ...agents.filter((a) => a.id !== me).map((a) => ({ value: a.id, label: a.name })),
  ]

  return (
    <Card className="min-w-0 gap-0 p-0">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-16 leading-snug font-extrabold">{t.subject}</h2>
          <p className="m-0 flex flex-wrap items-center gap-x-1.5 text-12 text-ink-muted">
            {who.map((w, i) => <span key={i}>{i > 0 && '· '}{w}</span>)}
            {t.requester.user_id && <Link to={`/users/${t.requester.user_id}`} className="font-bold text-primary">· View user</Link>}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {t.escalated_to && <Badge tone="warning">With engine team</Badge>}
            {t.status === 'resolved' && <Badge tone="success">Resolved{t.csat ? ` · rated ${t.csat}/5` : ''}</Badge>}
            {t.status === 'pending' && <Badge tone="info">Waiting for customer</Badge>}
          </div>
        </div>
        {canAct && (
          <div className="flex flex-wrap items-center gap-2.5">
            <SelectField variant="pill" aria-label="Priority" value={t.priority} options={PRIORITY_OPTIONS} onChange={(v) => void run(() => updateTicket(t.id, { priority: v as Priority }), 'Could not change the priority')} />
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card pl-3"><User size={14} className="text-ink-muted" />
              <SelectField variant="pill" aria-label="Assignee" className="[&>select]:border-0 [&>select]:font-bold" value={t.assigned_to ?? ''} options={t.assigned_to && !assignOptions.some((o) => o.value === t.assigned_to) ? [...assignOptions, { value: t.assigned_to, label: t.assigned_name ?? 'Assigned' }] : assignOptions} onChange={(v) => void run(() => assignTicket(t.id, v || null), 'Could not assign')} />
            </div>
            {t.status === 'resolved' ? (
              <Button variant="outline" onClick={() => void run(() => setTicketStatus(t.id, 'open'), 'Could not reopen')} leadingIcon={<ArrowCounterClockwise size={15} />}>Reopen</Button>
            ) : (
              <Button variant="outline" onClick={onEscalate} disabled={t.escalated_to !== null || !['super_admin', 'admin', 'support_agent'].includes(summary?.role ?? '')} leadingIcon={<GitBranch size={15} />}>Escalate to engine team</Button>
            )}
          </div>
        )}
      </header>

      <div className="flex max-h-[470px] min-h-64 flex-col gap-4 overflow-y-auto px-5 py-5" data-lenis-prevent>
        {t.messages.map((m) => <MessageBubble key={m.id} m={m} />)}
        <div ref={endRef} />
      </div>

      {canAct ? <Composer key={t.id} ticket={t} macros={macros} onDone={onChanged} /> : <p className="m-0 border-t border-border px-5 py-4 text-12 text-ink-muted">You can read this ticket, but your role can not reply to it.</p>}
    </Card>
  )
}
