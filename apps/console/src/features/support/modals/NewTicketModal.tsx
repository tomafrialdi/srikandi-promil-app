import { Plus, Warning, X } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Button, Field, Modal, ModalFooter, Notice, SelectField, TextAreaField, TextField, Toggle, useToast } from '../../../shared/ui'
import { CATEGORY_OPTIONS, CHANNEL_OPTIONS, PLAN_LABEL, PRIORITY_OPTIONS } from '../config/labels'
import { createTicket, searchUsers } from '../services/support.service'
import type { UserHit } from '../types'

/** Mount with a key per opening so the form starts empty. */
export function NewTicketModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<UserHit[]>([])
  const [user, setUser] = useState<UserHit | null>(null)
  const [f, setF] = useState({ requester_name: '', requester_email: '', channel: 'web', category: 'other', priority: 'medium', subject: '', body: '', assign_me: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (patch: Partial<typeof f>) => setF((s) => ({ ...s, ...patch }))

  useEffect(() => {
    if (user || query.trim().length < 2) return
    let cancelled = false
    const id = window.setTimeout(() => {
      searchUsers(query).then((r) => !cancelled && setHits(r)).catch(() => !cancelled && setHits([]))
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [query, user])

  const issue = !user && f.requester_name.trim().length < 2 ? 'Pick a user or enter the requester name' : f.subject.trim().length < 3 ? 'Write a subject' : f.body.trim().length < 2 ? 'Write the customer’s message' : null

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const id = await createTicket({ ...f, user_id: user?.id ?? '' })
      toast({ title: 'Ticket created', description: f.subject })
      onCreated(id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the ticket.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={() => !saving && onClose()} size="md" icon={<Plus size={20} />} title="New ticket" subtitle="Log a request that came in by phone, email or walk-in."
      footer={<ModalFooter info={issue ?? 'Ready to create'}><Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button onClick={save} disabled={saving || issue !== null}>{saving ? 'Creating…' : 'Create ticket'}</Button></ModalFooter>}>
      {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}
      <Field label="Requester" required>
        {user ? (
          <div className="flex items-center gap-3 rounded-xl bg-surface px-3.5 py-3">
            <span className="flex min-w-0 flex-1 flex-col"><span className="text-13 font-bold">{user.name}</span><span className="text-11 text-ink-muted">{user.email} · {PLAN_LABEL[user.plan] ?? user.plan}</span></span>
            <button type="button" aria-label="Clear user" className="text-ink-faint hover:text-error" onClick={() => { setUser(null); setHits([]) }}><X size={15} /></button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <TextField id="nt-search" label="" hideLabel placeholder="Search an app user by name or email…" value={query} onChange={(e) => { setQuery(e.target.value); if (e.target.value.trim().length < 2) setHits([]) }} />
            {hits.length > 0 && (
              <ul className="m-0 flex list-none flex-col rounded-xl border border-border p-0">
                {hits.map((h) => (
                  <li key={h.id}><button type="button" className="flex w-full flex-col px-3.5 py-2 text-left hover:bg-surface" onClick={() => { setUser(h); setHits([]) }}><span className="text-13 font-bold">{h.name}</span><span className="text-11 text-ink-muted">{h.email}</span></button></li>
                ))}
              </ul>
            )}
            <div className="grid gap-2.5 min-[701px]:grid-cols-2">
              <TextField id="nt-name" label="" hideLabel placeholder="…or type a name (no account)" maxLength={80} value={f.requester_name} onChange={(e) => set({ requester_name: e.target.value })} />
              <TextField id="nt-email" label="" hideLabel type="email" placeholder="Email (optional)" maxLength={120} value={f.requester_email} onChange={(e) => set({ requester_email: e.target.value })} />
            </div>
          </div>
        )}
      </Field>
      <div className="grid gap-3.5 min-[701px]:grid-cols-3">
        <Field label="Channel"><SelectField aria-label="Channel" value={f.channel} options={CHANNEL_OPTIONS} onChange={(channel) => set({ channel })} /></Field>
        <Field label="Category"><SelectField aria-label="Category" value={f.category} options={CATEGORY_OPTIONS} onChange={(category) => set({ category })} /></Field>
        <Field label="Priority"><SelectField aria-label="Priority" value={f.priority} options={PRIORITY_OPTIONS} onChange={(priority) => set({ priority })} /></Field>
      </div>
      <Field label="Subject" htmlFor="nt-subject" required><TextField id="nt-subject" label="" hideLabel maxLength={140} value={f.subject} onChange={(e) => set({ subject: e.target.value })} /></Field>
      <Field label="Customer's message" htmlFor="nt-body" required><TextAreaField id="nt-body" maxLength={4000} value={f.body} onChange={(e) => set({ body: e.target.value })} /></Field>
      <span className="flex items-center gap-3 text-13 font-bold">Assign to me <Toggle label="Assign to me" checked={f.assign_me} onChange={(assign_me) => set({ assign_me })} /></span>
    </Modal>
  )
}
