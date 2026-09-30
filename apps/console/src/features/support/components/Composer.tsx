import { LockSimple, PaperPlaneTilt, X } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { cn } from '../../../shared/lib/cn'
import { Button, useToast } from '../../../shared/ui'
import { fillMacro, firstName } from '../lib/format'
import { markMacroUsed, replyToTicket, updateTicket } from '../services/support.service'
import { SUGGESTED_TAGS } from '../config/labels'
import type { Macro, TicketFull } from '../types'

interface ComposerProps {
  ticket: TicketFull
  macros: Macro[]
  onDone: () => void
}

/** Reply box: "/" opens macros, internal notes, tags, Send / Send & resolve. Mount with a key per ticket. */
export function Composer({ ticket, macros, onDone }: ComposerProps) {
  const toast = useToast()
  const [text, setText] = useState('')
  const [note, setNote] = useState(false)
  const [busy, setBusy] = useState(false)
  const [active, setActive] = useState(0)
  const [newTag, setNewTag] = useState('')
  const resolved = ticket.status === 'resolved'

  const token = /(?:^|\s)(\/[a-z0-9-]*)$/.exec(text)?.[1] ?? null
  const matches = useMemo(() => (token ? macros.filter((m) => m.shortcut.startsWith(token) || m.title.toLowerCase().includes(token.slice(1))).slice(0, 5) : []), [token, macros])

  const pick = (m: Macro) => {
    setText((t) => t.replace(/(^|\s)\/[a-z0-9-]*$/, (_, lead: string) => lead) + fillMacro(m.body, ticket.requester.name))
    setActive(0)
    void markMacroUsed(m.id).catch(() => undefined)
  }

  const send = async (resolve: boolean) => {
    setBusy(true)
    try {
      await replyToTicket(ticket.id, text, note ? 'note' : 'agent', resolve)
      toast({ title: note ? 'Note added' : resolve ? 'Sent and resolved' : 'Reply sent' })
      setText('')
      onDone()
    } catch (err) {
      toast({ tone: 'error', title: 'Could not send', description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  const saveTags = async (tags: string[]) => {
    try {
      await updateTicket(ticket.id, { tags })
      onDone()
    } catch (err) {
      toast({ tone: 'error', title: 'Could not update tags', description: err instanceof Error ? err.message : undefined })
    }
  }

  const addTag = () => {
    const tag = newTag.trim().replace(/^#/, '')
    setNewTag('')
    if (tag && !ticket.tags.includes(tag.toLowerCase())) void saveTags([...ticket.tags, tag])
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border p-5">
      <div className="relative">
        <textarea
          aria-label="Reply"
          className={cn('min-h-24 w-full resize-y rounded-xl border px-3.5 py-3 text-13 leading-normal font-medium outline-0 placeholder:text-ink-faint focus-visible:border-primary', note ? 'border-warning bg-warning-soft' : 'border-border bg-surface')}
          placeholder={note ? 'Write an internal note — only staff can see it' : `Reply to ${firstName(ticket.requester.name)}… (type / for macros)`}
          maxLength={4000}
          value={text}
          onChange={(e) => { setText(e.target.value); setActive(0) }}
          onKeyDown={(e) => {
            if (matches.length > 0) {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % matches.length) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + matches.length) % matches.length) }
              else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(matches[active]!) }
              else if (e.key === 'Escape') setText((t) => t.replace(/\/[a-z0-9-]*$/, ''))
            }
          }}
        />
        {matches.length > 0 && (
          <ul role="listbox" aria-label="Macros" className="absolute right-0 bottom-full left-0 z-10 m-0 mb-1.5 list-none overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-menu">
            {matches.map((m, i) => (
              <li key={m.id} role="option" aria-selected={i === active}>
                <button type="button" className={cn('flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left', i === active && 'bg-primary-soft')} onMouseEnter={() => setActive(i)} onClick={() => pick(m)}>
                  <code className="flex-none text-12 font-bold text-primary">{m.shortcut}</code>
                  <span className="flex min-w-0 flex-col"><span className="text-12 font-bold">{m.title}</span><span className="truncate text-11 text-ink-muted">{m.body}</span></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {ticket.tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-md bg-surface-alt px-2 py-1 text-11 font-semibold text-ink-muted">
              #{t}
              <button type="button" aria-label={`Remove tag ${t}`} className="inline-flex text-ink-faint hover:text-error" onClick={() => void saveTags(ticket.tags.filter((x) => x !== t))}><X size={10} weight="bold" /></button>
            </span>
          ))}
          <input list="support-tags" aria-label="Add tag" className="h-7 w-24 rounded-md border border-dashed border-border bg-transparent px-2 text-11 font-semibold outline-0 placeholder:text-ink-faint focus-visible:border-primary" placeholder="+ tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} onBlur={addTag} />
          <datalist id="support-tags">{SUGGESTED_TAGS.map((t) => <option key={t} value={t} />)}</datalist>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="outline" onClick={() => setNote((n) => !n)} aria-pressed={note} leadingIcon={<LockSimple size={15} />}>{note ? 'Back to reply' : 'Internal note'}</Button>
          {note ? (
            <Button onClick={() => send(false)} disabled={busy || text.trim() === ''}>{busy ? 'Saving…' : 'Add note'}</Button>
          ) : (
            <>
              {!resolved && <Button variant="outline" onClick={() => send(false)} disabled={busy || text.trim() === ''}>Send</Button>}
              <Button onClick={() => send(true)} disabled={busy || text.trim() === ''} leadingIcon={<PaperPlaneTilt size={15} color="#fff" />}>{busy ? 'Sending…' : resolved ? 'Reply & keep resolved' : 'Send & resolve'}</Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
